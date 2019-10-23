'use strict';

var Curry = require("./curry.js");
var Caml_option = require("./caml_option.js");
var Caml_builtin_exceptions = require("./caml_builtin_exceptions.js");

function Make(funarg) {
  var height = function (param) {
    if (param) {
      return param.h;
    } else {
      return 0;
    }
  };
  var create = function (l, x, d, r) {
    var hl = height(l);
    var hr = height(r);
    return /* Node */[
            /* l */l,
            /* v */x,
            /* d */d,
            /* r */r,
            /* h */hl >= hr ? hl + 1 | 0 : hr + 1 | 0
          ];
  };
  var singleton = function (x, d) {
    return /* Node */[
            /* l : Empty */0,
            /* v */x,
            /* d */d,
            /* r : Empty */0,
            /* h */1
          ];
  };
  var bal = function (l, x, d, r) {
    var hl = l ? l.h : 0;
    var hr = r ? r.h : 0;
    if (hl > (hr + 2 | 0)) {
      if (l) {
        var lr = l.r;
        var ld = l.d;
        var lv = l.v;
        var ll = l.l;
        if (height(ll) >= height(lr)) {
          return create(ll, lv, ld, create(lr, x, d, r));
        } else if (lr) {
          return create(create(ll, lv, ld, lr.l), lr.v, lr.d, create(lr.r, x, d, r));
        } else {
          throw [
                Caml_builtin_exceptions.invalid_argument,
                "Map.bal"
              ];
        }
      } else {
        throw [
              Caml_builtin_exceptions.invalid_argument,
              "Map.bal"
            ];
      }
    } else if (hr > (hl + 2 | 0)) {
      if (r) {
        var rr = r.r;
        var rd = r.d;
        var rv = r.v;
        var rl = r.l;
        if (height(rr) >= height(rl)) {
          return create(create(l, x, d, rl), rv, rd, rr);
        } else if (rl) {
          return create(create(l, x, d, rl.l), rl.v, rl.d, create(rl.r, rv, rd, rr));
        } else {
          throw [
                Caml_builtin_exceptions.invalid_argument,
                "Map.bal"
              ];
        }
      } else {
        throw [
              Caml_builtin_exceptions.invalid_argument,
              "Map.bal"
            ];
      }
    } else {
      return /* Node */[
              /* l */l,
              /* v */x,
              /* d */d,
              /* r */r,
              /* h */hl >= hr ? hl + 1 | 0 : hr + 1 | 0
            ];
    }
  };
  var is_empty = function (param) {
    if (param) {
      return false;
    } else {
      return true;
    }
  };
  var add = function (x, data, m) {
    if (m) {
      var r = m.r;
      var d = m.d;
      var v = m.v;
      var l = m.l;
      var c = Curry._2(funarg.compare, x, v);
      if (c === 0) {
        if (d === data) {
          return m;
        } else {
          return /* Node */[
                  /* l */l,
                  /* v */x,
                  /* d */data,
                  /* r */r,
                  /* h */m.h
                ];
        }
      } else if (c < 0) {
        var ll = add(x, data, l);
        if (l === ll) {
          return m;
        } else {
          return bal(ll, v, d, r);
        }
      } else {
        var rr = add(x, data, r);
        if (r === rr) {
          return m;
        } else {
          return bal(l, v, d, rr);
        }
      }
    } else {
      return /* Node */[
              /* l : Empty */0,
              /* v */x,
              /* d */data,
              /* r : Empty */0,
              /* h */1
            ];
    }
  };
  var find = function (x, _param) {
    while(true) {
      var param = _param;
      if (param) {
        var c = Curry._2(funarg.compare, x, param.v);
        if (c === 0) {
          return param.d;
        } else {
          _param = c < 0 ? param.l : param.r;
          continue ;
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var find_first = function (f, _param) {
    while(true) {
      var param = _param;
      if (param) {
        var v = param.v;
        if (Curry._1(f, v)) {
          var _v0 = v;
          var _d0 = param.d;
          var f$1 = f;
          var _param$1 = param.l;
          while(true) {
            var param$1 = _param$1;
            var d0 = _d0;
            var v0 = _v0;
            if (param$1) {
              var v$1 = param$1.v;
              if (Curry._1(f$1, v$1)) {
                _param$1 = param$1.l;
                _d0 = param$1.d;
                _v0 = v$1;
                continue ;
              } else {
                _param$1 = param$1.r;
                continue ;
              }
            } else {
              return /* tuple */[
                      v0,
                      d0
                    ];
            }
          };
        } else {
          _param = param.r;
          continue ;
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var find_first_opt = function (f, _param) {
    while(true) {
      var param = _param;
      if (param) {
        var v = param.v;
        if (Curry._1(f, v)) {
          var _v0 = v;
          var _d0 = param.d;
          var f$1 = f;
          var _param$1 = param.l;
          while(true) {
            var param$1 = _param$1;
            var d0 = _d0;
            var v0 = _v0;
            if (param$1) {
              var v$1 = param$1.v;
              if (Curry._1(f$1, v$1)) {
                _param$1 = param$1.l;
                _d0 = param$1.d;
                _v0 = v$1;
                continue ;
              } else {
                _param$1 = param$1.r;
                continue ;
              }
            } else {
              return /* tuple */[
                      v0,
                      d0
                    ];
            }
          };
        } else {
          _param = param.r;
          continue ;
        }
      } else {
        return ;
      }
    };
  };
  var find_last = function (f, _param) {
    while(true) {
      var param = _param;
      if (param) {
        var v = param.v;
        if (Curry._1(f, v)) {
          var _v0 = v;
          var _d0 = param.d;
          var f$1 = f;
          var _param$1 = param.r;
          while(true) {
            var param$1 = _param$1;
            var d0 = _d0;
            var v0 = _v0;
            if (param$1) {
              var v$1 = param$1.v;
              if (Curry._1(f$1, v$1)) {
                _param$1 = param$1.r;
                _d0 = param$1.d;
                _v0 = v$1;
                continue ;
              } else {
                _param$1 = param$1.l;
                continue ;
              }
            } else {
              return /* tuple */[
                      v0,
                      d0
                    ];
            }
          };
        } else {
          _param = param.l;
          continue ;
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var find_last_opt = function (f, _param) {
    while(true) {
      var param = _param;
      if (param) {
        var v = param.v;
        if (Curry._1(f, v)) {
          var _v0 = v;
          var _d0 = param.d;
          var f$1 = f;
          var _param$1 = param.r;
          while(true) {
            var param$1 = _param$1;
            var d0 = _d0;
            var v0 = _v0;
            if (param$1) {
              var v$1 = param$1.v;
              if (Curry._1(f$1, v$1)) {
                _param$1 = param$1.r;
                _d0 = param$1.d;
                _v0 = v$1;
                continue ;
              } else {
                _param$1 = param$1.l;
                continue ;
              }
            } else {
              return /* tuple */[
                      v0,
                      d0
                    ];
            }
          };
        } else {
          _param = param.l;
          continue ;
        }
      } else {
        return ;
      }
    };
  };
  var find_opt = function (x, _param) {
    while(true) {
      var param = _param;
      if (param) {
        var c = Curry._2(funarg.compare, x, param.v);
        if (c === 0) {
          return Caml_option.some(param.d);
        } else {
          _param = c < 0 ? param.l : param.r;
          continue ;
        }
      } else {
        return ;
      }
    };
  };
  var mem = function (x, _param) {
    while(true) {
      var param = _param;
      if (param) {
        var c = Curry._2(funarg.compare, x, param.v);
        if (c === 0) {
          return true;
        } else {
          _param = c < 0 ? param.l : param.r;
          continue ;
        }
      } else {
        return false;
      }
    };
  };
  var min_binding = function (_param) {
    while(true) {
      var param = _param;
      if (param) {
        var l = param.l;
        if (l) {
          _param = l;
          continue ;
        } else {
          return /* tuple */[
                  param.v,
                  param.d
                ];
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var min_binding_opt = function (_param) {
    while(true) {
      var param = _param;
      if (param) {
        var l = param.l;
        if (l) {
          _param = l;
          continue ;
        } else {
          return /* tuple */[
                  param.v,
                  param.d
                ];
        }
      } else {
        return ;
      }
    };
  };
  var max_binding = function (_param) {
    while(true) {
      var param = _param;
      if (param) {
        var r = param.r;
        if (r) {
          _param = r;
          continue ;
        } else {
          return /* tuple */[
                  param.v,
                  param.d
                ];
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var max_binding_opt = function (_param) {
    while(true) {
      var param = _param;
      if (param) {
        var r = param.r;
        if (r) {
          _param = r;
          continue ;
        } else {
          return /* tuple */[
                  param.v,
                  param.d
                ];
        }
      } else {
        return ;
      }
    };
  };
  var remove_min_binding = function (param) {
    if (param) {
      var l = param.l;
      if (l) {
        return bal(remove_min_binding(l), param.v, param.d, param.r);
      } else {
        return param.r;
      }
    } else {
      throw [
            Caml_builtin_exceptions.invalid_argument,
            "Map.remove_min_elt"
          ];
    }
  };
  var merge = function (t1, t2) {
    if (t1) {
      if (t2) {
        var match = min_binding(t2);
        return bal(t1, match[0], match[1], remove_min_binding(t2));
      } else {
        return t1;
      }
    } else {
      return t2;
    }
  };
  var remove = function (x, m) {
    if (m) {
      var r = m.r;
      var d = m.d;
      var v = m.v;
      var l = m.l;
      var c = Curry._2(funarg.compare, x, v);
      if (c === 0) {
        return merge(l, r);
      } else if (c < 0) {
        var ll = remove(x, l);
        if (l === ll) {
          return m;
        } else {
          return bal(ll, v, d, r);
        }
      } else {
        var rr = remove(x, r);
        if (r === rr) {
          return m;
        } else {
          return bal(l, v, d, rr);
        }
      }
    } else {
      return /* Empty */0;
    }
  };
  var update = function (x, f, m) {
    if (m) {
      var r = m.r;
      var d = m.d;
      var v = m.v;
      var l = m.l;
      var c = Curry._2(funarg.compare, x, v);
      if (c === 0) {
        var match = Curry._1(f, Caml_option.some(d));
        if (match !== undefined) {
          var data = Caml_option.valFromOption(match);
          if (d === data) {
            return m;
          } else {
            return /* Node */[
                    /* l */l,
                    /* v */x,
                    /* d */data,
                    /* r */r,
                    /* h */m.h
                  ];
          }
        } else {
          return merge(l, r);
        }
      } else if (c < 0) {
        var ll = update(x, f, l);
        if (l === ll) {
          return m;
        } else {
          return bal(ll, v, d, r);
        }
      } else {
        var rr = update(x, f, r);
        if (r === rr) {
          return m;
        } else {
          return bal(l, v, d, rr);
        }
      }
    } else {
      var match$1 = Curry._1(f, undefined);
      if (match$1 !== undefined) {
        return /* Node */[
                /* l : Empty */0,
                /* v */x,
                /* d */Caml_option.valFromOption(match$1),
                /* r : Empty */0,
                /* h */1
              ];
      } else {
        return /* Empty */0;
      }
    }
  };
  var iter = function (f, _param) {
    while(true) {
      var param = _param;
      if (param) {
        iter(f, param.l);
        Curry._2(f, param.v, param.d);
        _param = param.r;
        continue ;
      } else {
        return /* () */0;
      }
    };
  };
  var map = function (f, param) {
    if (param) {
      var l$prime = map(f, param.l);
      var d$prime = Curry._1(f, param.d);
      var r$prime = map(f, param.r);
      return /* Node */[
              /* l */l$prime,
              /* v */param.v,
              /* d */d$prime,
              /* r */r$prime,
              /* h */param.h
            ];
    } else {
      return /* Empty */0;
    }
  };
  var mapi = function (f, param) {
    if (param) {
      var v = param.v;
      var l$prime = mapi(f, param.l);
      var d$prime = Curry._2(f, v, param.d);
      var r$prime = mapi(f, param.r);
      return /* Node */[
              /* l */l$prime,
              /* v */v,
              /* d */d$prime,
              /* r */r$prime,
              /* h */param.h
            ];
    } else {
      return /* Empty */0;
    }
  };
  var fold = function (f, _m, _accu) {
    while(true) {
      var accu = _accu;
      var m = _m;
      if (m) {
        _accu = Curry._3(f, m.v, m.d, fold(f, m.l, accu));
        _m = m.r;
        continue ;
      } else {
        return accu;
      }
    };
  };
  var for_all = function (p, _param) {
    while(true) {
      var param = _param;
      if (param) {
        if (Curry._2(p, param.v, param.d) && for_all(p, param.l)) {
          _param = param.r;
          continue ;
        } else {
          return false;
        }
      } else {
        return true;
      }
    };
  };
  var exists = function (p, _param) {
    while(true) {
      var param = _param;
      if (param) {
        if (Curry._2(p, param.v, param.d) || exists(p, param.l)) {
          return true;
        } else {
          _param = param.r;
          continue ;
        }
      } else {
        return false;
      }
    };
  };
  var add_min_binding = function (k, x, param) {
    if (param) {
      return bal(add_min_binding(k, x, param.l), param.v, param.d, param.r);
    } else {
      return singleton(k, x);
    }
  };
  var add_max_binding = function (k, x, param) {
    if (param) {
      return bal(param.l, param.v, param.d, add_max_binding(k, x, param.r));
    } else {
      return singleton(k, x);
    }
  };
  var join = function (l, v, d, r) {
    if (l) {
      if (r) {
        var rh = r.h;
        var lh = l.h;
        if (lh > (rh + 2 | 0)) {
          return bal(l.l, l.v, l.d, join(l.r, v, d, r));
        } else if (rh > (lh + 2 | 0)) {
          return bal(join(l, v, d, r.l), r.v, r.d, r.r);
        } else {
          return create(l, v, d, r);
        }
      } else {
        return add_max_binding(v, d, l);
      }
    } else {
      return add_min_binding(v, d, r);
    }
  };
  var concat = function (t1, t2) {
    if (t1) {
      if (t2) {
        var match = min_binding(t2);
        return join(t1, match[0], match[1], remove_min_binding(t2));
      } else {
        return t1;
      }
    } else {
      return t2;
    }
  };
  var concat_or_join = function (t1, v, d, t2) {
    if (d !== undefined) {
      return join(t1, v, Caml_option.valFromOption(d), t2);
    } else {
      return concat(t1, t2);
    }
  };
  var split = function (x, param) {
    if (param) {
      var r = param.r;
      var d = param.d;
      var v = param.v;
      var l = param.l;
      var c = Curry._2(funarg.compare, x, v);
      if (c === 0) {
        return /* tuple */[
                l,
                Caml_option.some(d),
                r
              ];
      } else if (c < 0) {
        var match = split(x, l);
        return /* tuple */[
                match[0],
                match[1],
                join(match[2], v, d, r)
              ];
      } else {
        var match$1 = split(x, r);
        return /* tuple */[
                join(l, v, d, match$1[0]),
                match$1[1],
                match$1[2]
              ];
      }
    } else {
      return /* tuple */[
              /* Empty */0,
              undefined,
              /* Empty */0
            ];
    }
  };
  var merge$1 = function (f, s1, s2) {
    if (s1) {
      var v1 = s1.v;
      if (s1.h >= height(s2)) {
        var match = split(v1, s2);
        return concat_or_join(merge$1(f, s1.l, match[0]), v1, Curry._3(f, v1, Caml_option.some(s1.d), match[1]), merge$1(f, s1.r, match[2]));
      }
      
    } else if (!s2) {
      return /* Empty */0;
    }
    if (s2) {
      var v2 = s2.v;
      var match$1 = split(v2, s1);
      return concat_or_join(merge$1(f, match$1[0], s2.l), v2, Curry._3(f, v2, match$1[1], Caml_option.some(s2.d)), merge$1(f, match$1[2], s2.r));
    } else {
      throw [
            Caml_builtin_exceptions.assert_failure,
            /* tuple */[
              "map.ml",
              393,
              10
            ]
          ];
    }
  };
  var union = function (f, s1, s2) {
    if (s1) {
      if (s2) {
        var d2 = s2.d;
        var v2 = s2.v;
        var d1 = s1.d;
        var v1 = s1.v;
        if (s1.h >= s2.h) {
          var match = split(v1, s2);
          var d2$1 = match[1];
          var l = union(f, s1.l, match[0]);
          var r = union(f, s1.r, match[2]);
          if (d2$1 !== undefined) {
            return concat_or_join(l, v1, Curry._3(f, v1, d1, Caml_option.valFromOption(d2$1)), r);
          } else {
            return join(l, v1, d1, r);
          }
        } else {
          var match$1 = split(v2, s1);
          var d1$1 = match$1[1];
          var l$1 = union(f, match$1[0], s2.l);
          var r$1 = union(f, match$1[2], s2.r);
          if (d1$1 !== undefined) {
            return concat_or_join(l$1, v2, Curry._3(f, v2, Caml_option.valFromOption(d1$1), d2), r$1);
          } else {
            return join(l$1, v2, d2, r$1);
          }
        }
      } else {
        return s1;
      }
    } else {
      return s2;
    }
  };
  var filter = function (p, m) {
    if (m) {
      var r = m.r;
      var d = m.d;
      var v = m.v;
      var l = m.l;
      var l$prime = filter(p, l);
      var pvd = Curry._2(p, v, d);
      var r$prime = filter(p, r);
      if (pvd) {
        if (l === l$prime && r === r$prime) {
          return m;
        } else {
          return join(l$prime, v, d, r$prime);
        }
      } else {
        return concat(l$prime, r$prime);
      }
    } else {
      return /* Empty */0;
    }
  };
  var partition = function (p, param) {
    if (param) {
      var d = param.d;
      var v = param.v;
      var match = partition(p, param.l);
      var lf = match[1];
      var lt = match[0];
      var pvd = Curry._2(p, v, d);
      var match$1 = partition(p, param.r);
      var rf = match$1[1];
      var rt = match$1[0];
      if (pvd) {
        return /* tuple */[
                join(lt, v, d, rt),
                concat(lf, rf)
              ];
      } else {
        return /* tuple */[
                concat(lt, rt),
                join(lf, v, d, rf)
              ];
      }
    } else {
      return /* tuple */[
              /* Empty */0,
              /* Empty */0
            ];
    }
  };
  var cons_enum = function (_m, _e) {
    while(true) {
      var e = _e;
      var m = _m;
      if (m) {
        _e = /* More */[
          m.v,
          m.d,
          m.r,
          e
        ];
        _m = m.l;
        continue ;
      } else {
        return e;
      }
    };
  };
  var compare = function (cmp, m1, m2) {
    var _e1 = cons_enum(m1, /* End */0);
    var _e2 = cons_enum(m2, /* End */0);
    while(true) {
      var e2 = _e2;
      var e1 = _e1;
      if (e1) {
        if (e2) {
          var c = Curry._2(funarg.compare, e1[0], e2[0]);
          if (c !== 0) {
            return c;
          } else {
            var c$1 = Curry._2(cmp, e1[1], e2[1]);
            if (c$1 !== 0) {
              return c$1;
            } else {
              _e2 = cons_enum(e2[2], e2[3]);
              _e1 = cons_enum(e1[2], e1[3]);
              continue ;
            }
          }
        } else {
          return 1;
        }
      } else if (e2) {
        return -1;
      } else {
        return 0;
      }
    };
  };
  var equal = function (cmp, m1, m2) {
    var _e1 = cons_enum(m1, /* End */0);
    var _e2 = cons_enum(m2, /* End */0);
    while(true) {
      var e2 = _e2;
      var e1 = _e1;
      if (e1) {
        if (e2 && Curry._2(funarg.compare, e1[0], e2[0]) === 0 && Curry._2(cmp, e1[1], e2[1])) {
          _e2 = cons_enum(e2[2], e2[3]);
          _e1 = cons_enum(e1[2], e1[3]);
          continue ;
        } else {
          return false;
        }
      } else if (e2) {
        return false;
      } else {
        return true;
      }
    };
  };
  var cardinal = function (param) {
    if (param) {
      return (cardinal(param.l) + 1 | 0) + cardinal(param.r) | 0;
    } else {
      return 0;
    }
  };
  var bindings_aux = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        _param = param.l;
        _accu = /* :: */[
          /* tuple */[
            param.v,
            param.d
          ],
          bindings_aux(accu, param.r)
        ];
        continue ;
      } else {
        return accu;
      }
    };
  };
  var bindings = function (s) {
    return bindings_aux(/* [] */0, s);
  };
  return {
          empty: /* Empty */0,
          is_empty: is_empty,
          mem: mem,
          add: add,
          update: update,
          singleton: singleton,
          remove: remove,
          merge: merge$1,
          union: union,
          compare: compare,
          equal: equal,
          iter: iter,
          fold: fold,
          for_all: for_all,
          exists: exists,
          filter: filter,
          partition: partition,
          cardinal: cardinal,
          bindings: bindings,
          min_binding: min_binding,
          min_binding_opt: min_binding_opt,
          max_binding: max_binding,
          max_binding_opt: max_binding_opt,
          choose: min_binding,
          choose_opt: min_binding_opt,
          split: split,
          find: find,
          find_opt: find_opt,
          find_first: find_first,
          find_first_opt: find_first_opt,
          find_last: find_last,
          find_last_opt: find_last_opt,
          map: map,
          mapi: mapi
        };
}

exports.Make = Make;
/* No side effect */
