(* Copyright (C) 2018 - Authors of BuckleScript
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * In addition to the permissions granted to you by the LGPL, you may combine
 * or link a "work that uses the Library" with a publicly distributed version
 * of this file to produce a combined library or application, then distribute
 * that combined work under the terms of your choosing, with no requirement
 * to comply with the obligations normally placed on you by section 4 of the
 * LGPL version 3 (or the corresponding section of a later version of the LGPL
 * should you choose to use a later version).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. *)


(** A conservative approach to avoid packing exceptions
    for lambda expression like {[
      try { ... }catch(id){body}
    ]}
    we approximate that if [id] is destructed or not.
    If it is destructed, we need pack it in case it is JS exception.
    The packing is called Js.Exn.internalTOOCamlException, which is a nop for OCaml exception, 
    but will wrap as (Error e) when it is an JS exception. 

    {[
      try .. with 
      | A (x,y) -> 
      | Js.Error ..
    ]}

    Without such wrapping, the code above would raise

    Note it is not guaranteed that exception raised(or re-raised) is a structured
    ocaml exception but it is guaranteed that if such exception is processed it would
    still be an ocaml exception.
    for example {[
      match x with
      | exception e -> raise e
    ]}
    it will re-raise an exception as it is (we are not packing it anywhere)

    It is hard to judge an exception is destructed or escaped, any potential
    alias(or if it is passed as an argument) would cause it to be leaked
*)
let exception_id_destructed (l : Lam.t) (fv : Ident.t): bool  =
  let rec 
    hit_opt (x : _ option) = 
  match x with 
  | None -> false
  | Some a -> hit a   
  and hit_list_snd : 'a. ('a * _ ) list -> bool = fun x ->    
    Ext_list.exists_snd  x  hit
  and hit_list xs = Ext_list.exists xs hit 
  and hit (l : Lam.t) =
    match l  with
    | Lprim {primitive = Pintcomp _ ;
             args = ([x;y ])  } ->
      begin match x,y with
        | Lvar _, Lvar _ -> false
        | Lvar _, _ -> hit y
        | _, Lvar _ -> hit x
        | _, _  -> hit x || hit y
      end
    | Lprim {primitive = Praise ; args = [Lvar _]} -> false
    | Lprim {primitive ; args; _} ->
      hit_list args
    | Lvar id ->    
      Ident.same id fv
    | Lassign(id, e) ->
      Ident.same id fv || hit e
    | Lstaticcatch(e1, (_,vars), e2) ->
      hit e1 || hit e2
    | Ltrywith(e1, exn, e2) ->
      hit e1 || hit e2
    | Lfunction{body;params} ->
      hit body;
    | Llet(str, id, arg, body) ->
      hit arg || hit body
    | Lletrec(decl, body) ->
      hit body ||
      hit_list_snd decl
    | Lfor(v, e1, e2, dir, e3) ->
      hit e1 || hit e2 || hit e3
    | Lconst _ -> false
    | Lapply{fn; args; _} ->
      hit fn || hit_list args
    | Lglobal_module _  (* global persistent module, play safe *)
      -> false
    | Lswitch(arg, sw) ->
      hit arg ||
      hit_list_snd sw.sw_consts ||
      hit_list_snd sw.sw_blocks ||
      hit_opt sw.sw_failaction 
    | Lstringswitch (arg,cases,default) ->
      hit arg ||
      hit_list_snd cases ||
      hit_opt default 
    | Lstaticraise (_,args) ->
      hit_list args
    | Lifthenelse(e1, e2, e3) ->
      hit e1 || hit e2 || hit e3
    | Lsequence(e1, e2) ->
      hit e1 || hit e2
    | Lwhile(e1, e2) ->
      hit e1 || hit e2
    | Lsend (k, met, obj, args, _) ->
      hit met || hit obj || hit_list args
  in hit l


let abs_int x = if x < 0 then - x else x
let no_over_flow x  = abs_int x < 0x1fff_ffff 

let lam_is_var (x : Lam.t) (y : Ident.t) = 
  match x with 
  | Lvar y2 -> Ident.same y2 y 
  | _ -> false

(** Make sure no int range overflow happens
    also we only check [int]
*)
let happens_to_be_diff
    (sw_consts :
       (int * Lambda.lambda) list) : int option =
  match sw_consts with
  | (a, Lconst (Const_pointer (a0,_)| Const_base (Const_int a0)))::
    (b, Lconst (Const_pointer (b0,_)| Const_base (Const_int b0)))::
    rest when
     no_over_flow a  &&
     no_over_flow a0 &&
     no_over_flow b &&
     no_over_flow b0 ->
    let diff = a0 - a in
    if b0 - b = diff then
      if Ext_list.for_all rest (fun (x, lam) ->
          match lam with
          | Lconst (Const_pointer(x0,_) | Const_base(Const_int x0))
            when no_over_flow x0 && no_over_flow x ->
            x0 - x = diff
          | _ -> false
        ) then
        Some diff
      else
        None
    else None
  | _ -> None 


let prim = Lam.prim 

type required_modules = Lam_module_ident.Hash_set.t


(** drop Lseq (List! ) etc 
  see #3852, we drop all these required global modules
  but added it back based on our own module analysis
*)
let rec drop_global_marker (lam : Lam.t) =
  match lam with
  | Lsequence (Lglobal_module id, rest) ->
    drop_global_marker rest
  | _ -> lam

let seq = Lam.seq 
let unit = Lam.unit 

let lam_prim ~primitive:( p : Lambda.primitive) ~args loc : Lam.t =
  match p with
  | Pint_as_pointer
  | Pidentity -> Ext_list.singleton_exn args 
  | Pccall _ -> assert false
  | Prevapply -> assert false
  | Pdirapply -> assert false
  | Ploc loc -> assert false (* already compiled away here*)

  | Pbytes_to_string (* handled very early *)
    -> prim ~primitive:Pbytes_to_string ~args loc
  | Pbytes_of_string -> prim ~primitive:Pbytes_of_string ~args loc
  | Pignore -> (* Pignore means return unit, it is not an nop *)
    seq (Ext_list.singleton_exn args) unit 
  | Pgetglobal id ->
    assert false
  | Psetglobal id ->
    (* we discard [Psetglobal] in the beginning*)
    drop_global_marker (Ext_list.singleton_exn args)
  (* prim ~primitive:(Psetglobal id) ~args loc *)
  | Pmakeblock (tag,info, mutable_flag
#if OCAML_VERSION =~ ">4.03.0"  then 
    , _block_shape
#end
  )
    -> 
    begin match info with 
    | Blk_some_not_nested 
      -> 
      prim ~primitive:Psome_not_nest ~args loc 
    | Blk_some 
      ->    
      prim ~primitive:Psome ~args loc 
    | Blk_constructor(xs,i) ->  
      let info : Lam_tag_info.t = Blk_constructor(xs,i) in
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
    | Blk_tuple  -> 
      let info : Lam_tag_info.t = Blk_tuple in
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
    | Blk_array -> 
      let info : Lam_tag_info.t = Blk_array in
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
    | Blk_variant s -> 
      let info : Lam_tag_info.t = Blk_variant s in
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
    | Blk_record s -> 
      let info : Lam_tag_info.t = Blk_record s in
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
    
#if OCAML_VERSION =~ ">4.03.0"  then
    | Blk_record_inlined (s,ctor,i) ->
      let info : Lam_tag_info.t = Blk_record_inlined (s, ctor,i) in
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
    | Blk_record_ext s ->
      let info : Lam_tag_info.t = Blk_record_ext s in
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
#end            
    | Blk_module s -> 
      let info : Lam_tag_info.t = Blk_module s in
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
    | Blk_extension_slot -> 
      let info : Lam_tag_info.t = Blk_extension_slot in
      ( 
#if OCAML_VERSION =~ ">4.03.0" then
      match args with 
      | [ Lconst (Const_string name);
          Lprim {primitive = Pccall {prim_name = "caml_fresh_oo_id"} ; }
        ] -> 
        prim ~primitive:(Pcreate_extension name) ~args:[] loc
      | _ ->
#end       
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
      )
    | Blk_lazy_general  
      ->       
        prim 
          ~primitive:(Pccall {prim_name="caml_lazy_make"; prim_arity = 1; prim_native_name = ""})
          ~args loc          
    | Blk_lazy_forward
    
    | Blk_na -> 
      let info : Lam_tag_info.t = Blk_na in
      prim ~primitive:(Pmakeblock (tag,info,mutable_flag)) ~args loc
    end  
  | Pfield (id,info)
    -> prim ~primitive:(Pfield (id,info)) ~args loc

  | Psetfield (id,b,
#if OCAML_VERSION =~ ">4.03.0"  then 
    _initialization_or_assignment,
#end
      info)
    -> prim ~primitive:(Psetfield (id,info)) ~args loc

  | Pfloatfield (id,info)
    -> prim ~primitive:(Pfloatfield (id,info)) ~args loc
  | Psetfloatfield (id,
#if OCAML_VERSION =~ ">4.03.0"  then 
    _initialization_or_assignment,
#end  
      info)
    -> prim ~primitive:(Psetfloatfield (id,info)) ~args loc
  | Pduprecord (repr,i)
    -> prim ~primitive:(Pduprecord(repr,i)) ~args loc
  | Plazyforce -> prim ~primitive:Plazyforce ~args loc


  | Praise _ ->
    prim ~primitive:Praise ~args loc
  | Psequand -> prim ~primitive:Psequand ~args loc
  | Psequor -> prim ~primitive:Psequor ~args loc
  | Pnot -> prim ~primitive:Pnot ~args loc
  | Pnegint -> prim ~primitive:Pnegint ~args  loc
  | Paddint -> prim ~primitive:Paddint ~args loc
  | Psubint -> prim ~primitive:Psubint ~args loc
  | Pmulint -> prim ~primitive:Pmulint ~args loc
  | Pdivint 
#if OCAML_VERSION =~ ">4.03.0" then
    _is_safe (*FIXME*)
#end    
    -> prim ~primitive:Pdivint ~args loc
  | Pmodint 
#if OCAML_VERSION =~ ">4.03.0" then
    _is_safe (*FIXME*)
#end  
    -> prim ~primitive:Pmodint ~args loc
  | Pandint -> prim ~primitive:Pandint ~args loc
  | Porint -> prim ~primitive:Porint ~args loc
  | Pxorint -> prim ~primitive:Pxorint ~args loc
  | Plslint -> prim ~primitive:Plslint ~args loc
  | Plsrint -> prim ~primitive:Plsrint ~args loc
  | Pasrint -> prim ~primitive:Pasrint ~args loc
  | Pstringlength -> prim ~primitive:Pstringlength ~args loc
  | Pstringrefu -> prim ~primitive:Pstringrefu ~args loc
#if OCAML_VERSION =~ ">4.03.0" then
#else
  | Pstringsetu
  | Pstringsets -> assert false
#end
  | Pabsfloat -> assert false
  | Pstringrefs -> prim ~primitive:Pstringrefs ~args loc
  | Pbyteslength -> prim ~primitive:Pbyteslength ~args loc
  | Pbytesrefu -> prim ~primitive:Pbytesrefu ~args loc
  | Pbytessetu -> prim ~primitive:Pbytessetu ~args  loc
  | Pbytesrefs -> prim ~primitive:Pbytesrefs ~args loc
  | Pbytessets -> prim ~primitive:Pbytessets ~args loc
  | Pisint -> prim ~primitive:Pisint ~args loc
  | Pisout -> prim ~primitive:Pisout ~args loc
  | Pbittest -> prim ~primitive:Pbittest ~args loc
  | Pintoffloat -> prim ~primitive:Pintoffloat ~args loc
  | Pfloatofint -> prim ~primitive:Pfloatofint ~args loc
  | Pnegfloat -> prim ~primitive:Pnegfloat ~args loc
  
  | Paddfloat -> prim ~primitive:Paddfloat ~args loc
  | Psubfloat -> prim ~primitive:Psubfloat ~args loc
  | Pmulfloat -> prim ~primitive:Pmulfloat ~args loc
  | Pdivfloat -> prim ~primitive:Pdivfloat ~args loc

  | Pbswap16 -> prim ~primitive:Pbswap16 ~args loc
  | Pintcomp x -> prim ~primitive:(Pintcomp x)  ~args loc
  | Poffsetint x -> prim ~primitive:(Poffsetint x) ~args loc
  | Poffsetref x -> prim ~primitive:(Poffsetref x) ~args  loc
  | Pfloatcomp x -> prim ~primitive:(Pfloatcomp x) ~args loc
  | Pmakearray 
#if OCAML_VERSION =~ ">4.03.0"  then
    (x, _mutable_flag) (*FIXME*)
#else
    x 
#end    
    -> prim ~primitive:(Pmakearray x) ~args  loc
  | Parraylength _ -> prim ~primitive:Parraylength ~args loc
  | Parrayrefu _ -> prim ~primitive:(Parrayrefu ) ~args loc
  | Parraysetu _ -> prim ~primitive:(Parraysetu ) ~args loc
  | Parrayrefs _ -> prim ~primitive:(Parrayrefs ) ~args loc
  | Parraysets _ -> prim ~primitive:(Parraysets ) ~args loc
  | Pbintofint x -> prim ~primitive:(Pbintofint x) ~args loc
  | Pintofbint x -> prim ~primitive:(Pintofbint x) ~args loc
  | Pnegbint x -> prim ~primitive:(Pnegbint x) ~args loc
  | Paddbint x -> prim ~primitive:(Paddbint x) ~args loc
  | Psubbint x -> prim ~primitive:(Psubbint x) ~args loc
  | Pmulbint x -> prim ~primitive:(Pmulbint x) ~args loc
  | Pdivbint 
#if OCAML_VERSION =~ ">4.03.0" then
    {size = x; is_safe } (*FIXME*)
#else
    x 
#end    
    ->
     prim ~primitive:(Pdivbint x) ~args loc
  | Pmodbint 
#if OCAML_VERSION =~ ">4.03.0" then
    {size = x; is_safe } (*FIXME*)
#else
    x 
#end  
    -> prim ~primitive:(Pmodbint x) ~args loc
  | Pandbint x -> prim ~primitive:(Pandbint x) ~args loc
  | Porbint x -> prim ~primitive:(Porbint x) ~args loc
  | Pxorbint x -> prim ~primitive:(Pxorbint x) ~args loc
  | Plslbint x -> prim ~primitive:(Plslbint x) ~args loc
  | Plsrbint x -> prim ~primitive:(Plsrbint x) ~args loc
  | Pasrbint x -> prim ~primitive:(Pasrbint x) ~args loc
  | Pbigarraydim x -> prim ~primitive:(Pbigarraydim x) ~args loc
  | Pstring_load_16 x -> prim ~primitive:(Pstring_load_16 x) ~args loc
  | Pstring_load_32 x -> prim ~primitive:(Pstring_load_32 x) ~args loc
  | Pstring_load_64 x -> prim ~primitive:(Pstring_load_64 x) ~args loc
  | Pstring_set_16 x -> prim ~primitive:(Pstring_set_16 x) ~args loc
  | Pstring_set_32 x -> prim ~primitive:(Pstring_set_32 x) ~args loc
  | Pstring_set_64 x -> prim ~primitive:(Pstring_set_64 x) ~args loc
  | Pbigstring_load_16 x -> prim ~primitive:(Pbigstring_load_16 x) ~args loc
  | Pbigstring_load_32 x -> prim ~primitive:(Pbigstring_load_32 x) ~args loc
  | Pbigstring_load_64 x -> prim ~primitive:(Pbigstring_load_64 x) ~args loc
  | Pbigstring_set_16 x -> prim ~primitive:(Pbigstring_set_16 x) ~args loc
  | Pbigstring_set_32 x -> prim ~primitive:(Pbigstring_set_32 x) ~args loc
  | Pbigstring_set_64 x -> prim ~primitive:(Pbigstring_set_64 x) ~args loc
  | Pctconst x ->
    begin match x with
      | Word_size ->
        Lam.const (Const_int 32) 
      | _ -> prim ~primitive:(Pctconst x) ~args loc
    end

  | Pbbswap x -> prim ~primitive:(Pbbswap x) ~args loc
  | Pcvtbint (a,b) -> prim ~primitive:(Pcvtbint (a,b)) ~args loc
  | Pbintcomp (a,b) -> prim ~primitive:(Pbintcomp (a,b)) ~args loc
  | Pbigarrayref (a,b,c,d) -> prim ~primitive:(Pbigarrayref (a,b,c,d)) ~args loc
  | Pbigarrayset (a,b,c,d) -> prim ~primitive:(Pbigarrayset (a,b,c,d)) ~args loc
#if OCAML_VERSION =~ ">4.03.0" then 
  | Pfield_computed -> 
    prim ~primitive:Pfield_computed ~args loc 
  | Popaque -> Ext_list.singleton_exn args      
  | Psetfield_computed _ ->  
    prim ~primitive:Psetfield_computed ~args loc 
  | Pduparray _ ->  assert false 
    (* Does not exist since we compile array in js backend unlike native backend *)
#end




let may_depend = Lam_module_ident.Hash_set.add


let convert (exports : Ident_set.t) (lam : Lambda.lambda) : Lam.t * Lam_module_ident.Hash_set.t  =
  let alias_tbl = Ident_hashtbl.create 64 in
  let exit_map = Int_hashtbl.create 0 in
  let may_depends = Lam_module_ident.Hash_set.create 0 in

  let rec
    convert_ccall (a_prim : Primitive_compat.t)  (args : Lambda.lambda list) loc : Lam.t =
    let prim_name = a_prim.prim_name in
    let prim_name_len  = String.length prim_name in
    match External_ffi_types.from_string a_prim.prim_native_name with
    | Ffi_normal ->
      if prim_name_len > 0 && String.unsafe_get prim_name 0 = '#' then
        convert_js_primitive a_prim args loc
      else
        (* COMPILER CHECK *)
        (* Here the invariant we should keep is that all exception
           created should be captured
        *)
          (
#if OCAML_VERSION =~ ">4.03.0" then
#else
          match prim_name  ,  args with
          | "caml_set_oo_id" ,
            [ Lprim (Pmakeblock(tag,Blk_extension_slot, _),
                     Lconst (Const_base(Const_string(name,_))) :: _,
                     loc
                    )]
            -> prim ~primitive:(Pcreate_extension name) ~args:[] loc
          | _ , _->
#end          
            let args = Ext_list.map args convert_aux in
            prim ~primitive:(Pccall a_prim) ~args loc
          )
    | Ffi_obj_create labels ->
      let args = Ext_list.map args  convert_aux in
      prim ~primitive:(Pjs_object_create labels) ~args loc
    | Ffi_bs(arg_types, result_type, ffi) ->
      let args = Ext_list.map args convert_aux in
      Lam.handle_bs_non_obj_ffi arg_types result_type ffi args loc prim_name
    | Ffi_inline_const i -> Lam.const i

  and convert_js_primitive (p: Primitive_compat.t) (args : Lambda.lambda list) loc =
    let s = p.prim_name in
    match () with
    | _ when s = "#is_none" -> 
      prim ~primitive:Pis_not_none ~args:(Ext_list.map args convert_aux ) loc 
    | _ when s = "#val_from_unnest_option" 
      -> 
      prim ~primitive:Pval_from_option_not_nest
        ~args:[convert_aux (Ext_list.singleton_exn args)] loc
    | _ when s = "#val_from_option" 
      -> 
      prim ~primitive:Pval_from_option
        ~args:(Ext_list.map args convert_aux ) loc
    | _ when s = "#raw_expr" ->
      (match args with
       | [Lconst( Const_base (Const_string(s,_)))] ->
         prim ~primitive:(Praw_js_code_exp s)
           ~args:[] loc
       | _ -> assert false)
      
    | _ when s = "#raw_function" ->   
      (match args with
       | [Lconst( Const_base (Const_string(s,_)))] ->
         let v = Ast_exp_extension.fromString s in 
         prim ~primitive:(Praw_js_function (v.block, v.args))
           ~args:[] loc
       | _ -> assert false)
      
    | _ when s = "#raw_stmt" ->
      begin match args with
        | [Lconst( Const_base (Const_string(s,_)))] ->
          prim ~primitive:(Praw_js_code_stmt s)
            ~args:[] loc
        | _ -> assert false
      end
    | _ when s =  "#debugger"  ->
      (* ATT: Currently, the arity is one due to PPX *)
      prim ~primitive:Pdebugger ~args:[] loc
    | _ when s = "#null" ->
      Lam.const (Const_js_null)
    | _ when s = "#os_type" ->    
      Lam.const (Const_string Sys.os_type)
    | _ when s = "#undefined" ->
      Lam.const (Const_js_undefined)
    | _ when s = "#init_mod" ->
      let args = Ext_list.map args  convert_aux in
      begin match args with
      | [_loc; Lconst(Const_block(0,_,[Const_block(0,_,[])]))]
        ->
        Lam.unit
      | _ -> prim ~primitive:Pinit_mod ~args loc
      end
    | _ when s = "#update_mod" ->
      let args = Ext_list.map args convert_aux in
      begin match args with
      | [Lconst(Const_block(0,_,[Const_block(0,_,[])]));_;_]
        -> Lam.unit
      | _ -> prim ~primitive:Pupdate_mod ~args loc
      end
    | _ ->
      let primitive : Lam_primitive.t =
        match s with
        | "#apply" -> Pjs_runtime_apply
        | "#apply1"
        | "#apply2"
        | "#apply3"
        | "#apply4"
        | "#apply5"
        | "#apply6"
        | "#apply7"
        | "#apply8" -> Pjs_apply
        | "#makemutablelist" ->
          Pmakeblock(0, Blk_constructor("::",1),Mutable)
        | "#setfield1" ->
          Psetfield(1,  Fld_set_na)
        | "#undefined_to_opt" -> Pundefined_to_opt
        | "#nullable_to_opt" -> Pnull_undefined_to_opt
        | "#null_to_opt" -> Pnull_to_opt
        | "#is_nullable" -> Pis_null_undefined
        | "#string_append" -> Pstringadd
        | "#obj_length" -> Pcaml_obj_length
        | "#function_length" -> Pjs_function_length

        | "#unsafe_lt" -> Pjscomp Clt
        | "#unsafe_gt" -> Pjscomp Cgt
        | "#unsafe_le" -> Pjscomp Cle
        | "#unsafe_ge" -> Pjscomp Cge
        | "#unsafe_eq" -> Pjscomp Ceq
        | "#unsafe_neq" -> Pjscomp Cneq

        | "#typeof" -> Pjs_typeof
        | "#fn_run" | "#method_run" -> Pjs_fn_run(Ext_pervasives.nat_of_string_exn p.prim_native_name)
        | "#fn_mk" -> Pjs_fn_make (Ext_pervasives.nat_of_string_exn p.prim_native_name)
        | "#fn_method" -> Pjs_fn_method (Ext_pervasives.nat_of_string_exn p.prim_native_name)
        | "#unsafe_downgrade" -> Pjs_unsafe_downgrade (Ext_string.empty,loc)
        | _ -> Location.raise_errorf ~loc
                 "@{<error>Error:@} internal error, using unrecorgnized primitive %s" s
      in
      let args = Ext_list.map args convert_aux in
      prim ~primitive ~args loc
  and convert_aux (lam : Lambda.lambda) : Lam.t =
    match lam with
    | Lvar x ->
      let var = Ident_hashtbl.find_default alias_tbl x x in
      if Ident.persistent var then
        Lam.global_module var
      else
        Lam.var var
    | Lconst x ->
      Lam.const (Lam_constant_convert.convert_constant x )
    | Lapply 
#if OCAML_VERSION =~ ">4.03.0" then
        {ap_func = fn; ap_args = args; ap_loc = loc; }
#else
    (fn,args,loc)
#end    
      ->
          (** we need do this eargly in case [aux fn] add some wrapper *)
          Lam.apply (convert_aux fn) (Ext_list.map args convert_aux ) loc App_na  
    | Lfunction 
#if OCAML_VERSION =~ ">4.03.0" then 
    {kind; params; body }
#else
    (kind,  params,body)
#end    
      ->  
      assert (kind = Curried);
      Lam.function_
            ~arity:(List.length params)  ~params
            ~body:(convert_aux body)
    | Llet 
#if OCAML_VERSION =~ ">4.03.0" then
      (kind,_value_kind, id,e,body) (*FIXME*)
#else
      (kind,id,e,body)
#end      
      -> convert_let kind id e body

    | Lletrec (bindings,body)
      ->
      let bindings = Ext_list.map_snd  bindings convert_aux in
      let body = convert_aux body in
      let lam = Lam.letrec bindings body in
      Lam_scc.scc bindings lam body
    (* inlining will affect how mututal recursive behave *)
    | Lprim(Prevapply, [x ; f ],  outer_loc)
    | Lprim(Pdirapply, [f ; x],  outer_loc) ->
      convert_pipe f x outer_loc
    | Lprim (Prevapply, _, _ ) -> assert false
    | Lprim(Pdirapply, _, _) -> assert false
    | Lprim(Pccall a, args, loc)  ->
      convert_ccall (Primitive_compat.of_primitive_description a) args loc
    | Lprim (Pgetglobal id, args, loc) ->
      let args = Ext_list.map args convert_aux in
      if Ident.is_predef_exn id then
        Lam.prim ~primitive:(Pglobal_exception id) ~args loc 
      else
        begin
          may_depend may_depends (Lam_module_ident.of_ml id);
          assert (args = []);
          Lam.global_module id
        end
    | Lprim (primitive,args, loc)
      ->
      let args = Ext_list.map args convert_aux in
      lam_prim ~primitive ~args loc
    | Lswitch 
#if OCAML_VERSION =~ ">4.03.0" then
      (e,s, _loc)
#else
      (e,s) 
#end      
      -> convert_switch e s
    | Lstringswitch (e, cases, default, _ ) ->
      Lam.stringswitch 
      (convert_aux e) 
      (Ext_list.map_snd cases convert_aux)
      (Ext_option.map default convert_aux)
    | Lstaticraise (id,[]) ->
        (match Int_hashtbl.find_opt exit_map id  with
        | None -> Lam.staticraise id []
        | Some new_id -> Lam.staticraise new_id [])      
    | Lstaticraise (id, args) ->
      Lam.staticraise id (Ext_list.map args convert_aux )
    | Lstaticcatch (b, (i,[]), Lstaticraise (j,[]) )
      -> (* peep-hole [i] aliased to [j] *)
      let new_i = Int_hashtbl.find_default exit_map j j in
      Int_hashtbl.add exit_map i new_i ;
      convert_aux b
    | Lstaticcatch (b, (i, ids), handler) ->
      Lam.staticcatch (convert_aux b) (i,ids) (convert_aux handler)
    | Ltrywith (b, id, handler) ->
      let body = convert_aux b in
      let handler = convert_aux handler in
      if exception_id_destructed handler id then
        let newId = Ident.create ("raw_" ^ id.name) in
        Lam.try_ body newId
                  (Lam.let_ StrictOpt id
                    (prim ~primitive:Pwrap_exn ~args:[Lam.var newId] Location.none)
                    handler
                 )
      else
        Lam.try_  body id handler
    | Lifthenelse (b,then_,else_) ->
      Lam.if_ (convert_aux b) (convert_aux then_) (convert_aux else_)
    | Lsequence (a,b)
      -> Lam.seq (convert_aux a) (convert_aux b)
    | Lwhile (b,body) ->
      Lam.while_ (convert_aux b) (convert_aux body)
    | Lfor (id, from_, to_, dir, loop) ->
      Lam.for_ id (convert_aux from_) (convert_aux to_) dir (convert_aux loop)
    | Lassign (id, body) ->
      Lam.assign id (convert_aux body)
    | Lsend (kind, a,b,ls, loc) ->
      (* Format.fprintf Format.err_formatter "%a@." Printlambda.lambda b ; *)
        (match convert_aux b with
        | Lprim {primitive =  Pjs_unsafe_downgrade(_,loc);  args}
          ->
          begin match kind, ls with
            | Public (Some name), [] ->
              prim ~primitive:(Pjs_unsafe_downgrade (name,loc))
                ~args loc
            | _ -> assert false
          end
        | b ->
          Lam.send kind (convert_aux a)  b (Ext_list.map ls convert_aux) loc)
      
    | Levent (e, event) ->
      (* disabled by upstream*)
      assert false
    | Lifused (id, e) -> convert_aux e (* TODO: remove it ASAP *)

  and convert_let (kind : Lam_compat.let_kind) id (e : Lambda.lambda) body : Lam.t = 
    match kind, e with
    | Alias , Lvar u  ->
      let new_u = Ident_hashtbl.find_default alias_tbl u u in
      Ident_hashtbl.add alias_tbl id new_u ;
      if Ident_set.mem exports id then
        Lam.let_ kind id (Lam.var new_u) (convert_aux body)
      else convert_aux body
    | Alias ,  Lprim (Pgetglobal u,[], _) when not (Ident.is_predef_exn u)
      ->
      Ident_hashtbl.add alias_tbl id u;
      may_depend may_depends (Lam_module_ident.of_ml u);
      if Ident_set.mem exports id then
        Lam.let_ kind id (Lam.var u) (convert_aux body)
      else convert_aux body

    | _, _ -> 
      let new_e = convert_aux e in 
      let new_body = convert_aux body in 
          (*
            reverse engineering cases as {[           
           (let (switcher/1013 =a (-1+ match/1012))
               (if (isout 2 switcher/1013) (exit 1)
                   (switch* switcher/1013
                      case int 0: 'a'
                        case int 1: 'b'
                        case int 2: 'c')))            
         ]}
         To elemininate the id [switcher], we need ensure it appears only 
         in two places.

         To advance this case, when [sw_failaction] is None
      *)
      match kind, new_e, new_body with 
      | Alias, Lprim {primitive = Poffsetint offset; args =  [Lvar _ as matcher ]},
        Lswitch (Lvar switcher3 ,
                 ({
                   sw_numconsts = false ; 
                   sw_consts ;
                   sw_blocks = []; sw_numblocks = true;
                   sw_failaction = Some ifso
                 } as px)
                ) 
        when Ident.same switcher3 id    &&
             not (Lam_hit.hit_variable id ifso ) && 
             not (Ext_list.exists_snd sw_consts (Lam_hit.hit_variable id))
        -> 
        Lam.switch matcher 
          {px with 
           sw_consts = 
             Ext_list.map sw_consts 
               (fun (i,act) -> i - offset, act)
          }
      | _ -> 
        Lam.let_ kind id new_e new_body
  and convert_pipe (f : Lambda.lambda) (x : Lambda.lambda) outer_loc =        
      let x  = convert_aux x in
      let f =  convert_aux f in
      match  f with
      | Lfunction {params = [param]; body = Lprim{primitive; args = [Lvar inner_arg]; loc }}
        when Ident.same param inner_arg -> 
        Lam.prim ~primitive ~args:[x] outer_loc
      | Lapply {fn = Lfunction{params; body = Lprim{primitive; args = inner_args}}; args}
        when Ext_list.for_all2_no_exn inner_args params lam_is_var &&
             Ext_list.length_larger_than_n inner_args args 1 
        ->
        Lam.prim ~primitive ~args:(Ext_list.append_one args x) outer_loc
      | Lapply{fn;args} ->
        Lam.apply fn (Ext_list.append_one args x) outer_loc App_na
      | _ ->
        Lam.apply f [x] outer_loc App_na
    and convert_switch (e : Lambda.lambda) (s : Lambda.lambda_switch) = 
        let  e = convert_aux e in
        match s with
        | {
          sw_failaction = None ;
          sw_blocks = [];
          sw_numblocks = 0;
          sw_consts ;
          sw_numconsts ;
        } ->
          begin match happens_to_be_diff sw_consts with
            | Some 0 -> e
            | Some i ->
              prim
                ~primitive:Paddint
                ~args:[e; Lam.const(Const_int i)]
                Location.none
            | None ->
              Lam.switch e
                {sw_failaction = None;
                 sw_blocks = [];
                 sw_numblocks = true;
                 sw_consts =
                   Ext_list.map_snd  sw_consts convert_aux;
                 sw_numconsts = 
                   Ext_list.length_ge sw_consts sw_numconsts;
                 sw_names = s.sw_names;
                }
          end
        | _ -> 
          Lam.switch  e   
            { sw_numconsts =  Ext_list.length_ge s.sw_consts s.sw_numconsts ;
              sw_consts = Ext_list.map_snd  s.sw_consts convert_aux;
              sw_numblocks = Ext_list.length_ge s.sw_blocks s.sw_numblocks;
              sw_blocks = Ext_list.map_snd s.sw_blocks convert_aux;
              sw_failaction =Ext_option.map s.sw_failaction convert_aux;
              sw_names = s.sw_names } in
  convert_aux lam , may_depends


(** FIXME: more precise analysis of [id], if it is not 
    used, we can remove it
        only two places emit [Lifused],
        {[
          lsequence (Lifused(id, set_inst_var obj id expr)) rem
          Lifused (env2, Lprim(Parrayset Paddrarray, [Lvar self; Lvar env2; Lvar env1']))
        ]}

        Note the variable, [id], or [env2] is already defined, it can be removed if it is not
        used. This optimization seems useful, but doesnt really matter since it only hit translclass

        more details, see [translclass] and [if_used_test]
        seems to be an optimization trick for [translclass]
        
        | Lifused(v, l) ->
          if count_var v > 0 then simplif l else lambda_unit
      *)  


      (*
        | Lfunction(kind,params,Lprim(prim,inner_args,inner_loc))
          when List.for_all2_no_exn (fun x y ->
          match y with
          | Lambda.Lvar y when Ident.same x y -> true
          | _ -> false
           ) params inner_args
          ->
          let rec aux outer_args params =
            match outer_args, params with
            | x::xs , _::ys ->
              x :: aux xs ys
            | [], [] -> []
            | x::xs, [] ->
            | [], y::ys
          if Ext_list.same_length inner_args args then
            aux (Lprim(prim,args,inner_loc))
          else

           {[
             (fun x y -> f x y) (computation;e) -->
             (fun y -> f (computation;e) y)
           ]}
              is wrong

              or
           {[
             (fun x y -> f x y ) ([|1;2;3|]) -->
             (fun y -> f [|1;2;3|] y)
           ]}
              is also wrong.

              It seems, we need handle [@bs.splice] earlier

              or
           {[
             (fun x y -> f x y) ([|1;2;3|]) -->
             let x0, x1, x2 =1,2,3 in
             (fun y -> f [|x0;x1;x2|] y)
           ]}
              But this still need us to know [@bs.splice] in advance


           we should not remove it immediately, since we have to be careful
                  where it is used, it can be [exported], [Lvar] or [Lassign] etc
                  The other common mistake is that
           {[
             let x = y (* elimiated x/y*)
             let u = x  (* eliminated u/x *)
           ]}

            however, [x] is already eliminated
           To improve the algorithm
           {[
             let x = y (* x/y *)
             let u = x (* u/y *)
           ]}
                  This looks more correct, but lets be conservative here

                  global module inclusion {[ include List ]}
                  will cause code like {[ let include =a Lglobal_module (list)]}

                  when [u] is global, it can not be bound again,
                  it should always be the leaf
        *)      