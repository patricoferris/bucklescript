'use strict';

var Obj = require("./obj.js");
var Sys = require("./sys.js");
var $$Array = require("./array.js");
var Curry = require("./curry.js");
var Random = require("./random.js");
var Hashtbl = require("./hashtbl.js");
var Caml_obj = require("./caml_obj.js");
var Caml_array = require("./caml_array.js");
var Caml_int32 = require("./caml_int32.js");
var Caml_option = require("./caml_option.js");
var Caml_primitive = require("./caml_primitive.js");
var CamlinternalLazy = require("./camlinternalLazy.js");
var Caml_builtin_exceptions = require("./caml_builtin_exceptions.js");

function create(param) {
  return Obj.Ephemeron.create(1);
}

function get_key(t) {
  return Obj.Ephemeron.get_key(t, 0);
}

function get_key_copy(t) {
  return Obj.Ephemeron.get_key_copy(t, 0);
}

function set_key(t, k) {
  return Obj.Ephemeron.set_key(t, 0, k);
}

function unset_key(t) {
  return Obj.Ephemeron.unset_key(t, 0);
}

function check_key(t) {
  return Obj.Ephemeron.check_key(t, 0);
}

function blit_key(t1, t2) {
  return Obj.Ephemeron.blit_key(t1, 0, t2, 0, 1);
}

function get_data(t) {
  return Obj.Ephemeron.get_data(t);
}

function get_data_copy(t) {
  return Obj.Ephemeron.get_data_copy(t);
}

function set_data(t, d) {
  return Obj.Ephemeron.set_data(t, d);
}

function unset_data(t) {
  return Obj.Ephemeron.unset_data(t);
}

function check_data(t) {
  return Obj.Ephemeron.check_data(t);
}

function blit_data(t1, t2) {
  return Obj.Ephemeron.blit_data(t1, t2);
}

function MakeSeeded(H) {
  var create = function (k, d) {
    var c = Obj.Ephemeron.create(1);
    Obj.Ephemeron.set_data(c, d);
    set_key(c, k);
    return c;
  };
  var hash = H.hash;
  var equal = function (c, k) {
    var match = Obj.Ephemeron.get_key(c, 0);
    if (match !== undefined) {
      if (Curry._2(H.equal, k, Caml_option.valFromOption(match))) {
        return /* ETrue */0;
      } else {
        return /* EFalse */1;
      }
    } else {
      return /* EDead */2;
    }
  };
  var set_key_data = function (c, k, d) {
    Obj.Ephemeron.unset_data(c);
    set_key(c, k);
    return Obj.Ephemeron.set_data(c, d);
  };
  var power_2_above = function (_x, n) {
    while(true) {
      var x = _x;
      if (x >= n || (x << 1) > Sys.max_array_length) {
        return x;
      } else {
        _x = (x << 1);
        continue ;
      }
    };
  };
  var prng = Caml_obj.caml_lazy_make((function (param) {
          return Random.State.make_self_init(/* () */0);
        }));
  var create$1 = function ($staropt$star, initial_size) {
    var random = $staropt$star !== undefined ? $staropt$star : Hashtbl.is_randomized(/* () */0);
    var s = power_2_above(16, initial_size);
    var seed = random ? Random.State.bits(CamlinternalLazy.force(prng)) : 0;
    return /* record */[
            /* size */0,
            /* data */Caml_array.caml_make_vect(s, /* Empty */0),
            /* seed */seed,
            /* initial_size */s
          ];
  };
  var clear = function (h) {
    h[/* size */0] = 0;
    var len = h[/* data */1].length;
    for(var i = 0 ,i_finish = len - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(h[/* data */1], i, /* Empty */0);
    }
    return /* () */0;
  };
  var reset = function (h) {
    var len = h[/* data */1].length;
    if (len === h[/* initial_size */3]) {
      return clear(h);
    } else {
      h[/* size */0] = 0;
      h[/* data */1] = Caml_array.caml_make_vect(h[/* initial_size */3], /* Empty */0);
      return /* () */0;
    }
  };
  var copy = function (h) {
    return /* record */[
            /* size */h[/* size */0],
            /* data */$$Array.copy(h[/* data */1]),
            /* seed */h[/* seed */2],
            /* initial_size */h[/* initial_size */3]
          ];
  };
  var key_index = function (h, hkey) {
    return hkey & (h[/* data */1].length - 1 | 0);
  };
  var clean = function (h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (check_key(c)) {
            return /* Cons */[
                    param[0],
                    c,
                    do_bucket(rest)
                  ];
          } else {
            h[/* size */0] = h[/* size */0] - 1 | 0;
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var resize = function (h) {
    var odata = h[/* data */1];
    var osize = odata.length;
    var nsize = (osize << 1);
    clean(h);
    if (nsize < Sys.max_array_length && h[/* size */0] >= (osize >>> 1)) {
      var ndata = Caml_array.caml_make_vect(nsize, /* Empty */0);
      h[/* data */1] = ndata;
      var insert_bucket = function (param) {
        if (param) {
          var hkey = param[0];
          insert_bucket(param[2]);
          var nidx = key_index(h, hkey);
          return Caml_array.caml_array_set(ndata, nidx, /* Cons */[
                      hkey,
                      param[1],
                      Caml_array.caml_array_get(ndata, nidx)
                    ]);
        } else {
          return /* () */0;
        }
      };
      for(var i = 0 ,i_finish = osize - 1 | 0; i <= i_finish; ++i){
        insert_bucket(Caml_array.caml_array_get(odata, i));
      }
      return /* () */0;
    } else {
      return 0;
    }
  };
  var add = function (h, key, info) {
    var hkey = Curry._2(hash, h[/* seed */2], key);
    var i = key_index(h, hkey);
    var container = create(key, info);
    var bucket_002 = Caml_array.caml_array_get(h[/* data */1], i);
    var bucket = /* Cons */[
      hkey,
      container,
      bucket_002
    ];
    Caml_array.caml_array_set(h[/* data */1], i, bucket);
    h[/* size */0] = h[/* size */0] + 1 | 0;
    if (h[/* size */0] > (h[/* data */1].length << 1)) {
      return resize(h);
    } else {
      return 0;
    }
  };
  var remove = function (h, key) {
    var hkey = Curry._2(hash, h[/* seed */2], key);
    var remove_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          var hk = param[0];
          if (hkey === hk) {
            var match = equal(c, key);
            switch (match) {
              case /* ETrue */0 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  return next;
              case /* EFalse */1 :
                  return /* Cons */[
                          hk,
                          c,
                          remove_bucket(next)
                        ];
              case /* EDead */2 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  _param = next;
                  continue ;
              
            }
          } else {
            return /* Cons */[
                    hk,
                    c,
                    remove_bucket(next)
                  ];
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var i = key_index(h, hkey);
    return Caml_array.caml_array_set(h[/* data */1], i, remove_bucket(Caml_array.caml_array_get(h[/* data */1], i)));
  };
  var find = function (h, key) {
    var hkey = Curry._2(hash, h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var match$1 = get_data(c);
            if (match$1 !== undefined) {
              return Caml_option.valFromOption(match$1);
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var find_opt = function (h, key) {
    var hkey = Curry._2(hash, h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var d = get_data(c);
            if (d !== undefined) {
              return d;
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return ;
      }
    };
  };
  var find_all = function (h, key) {
    var hkey = Curry._2(hash, h[/* seed */2], key);
    var find_in_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal(c, key);
            if (match !== 0) {
              _param = rest;
              continue ;
            } else {
              var match$1 = get_data(c);
              if (match$1 !== undefined) {
                return /* :: */[
                        Caml_option.valFromOption(match$1),
                        find_in_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* [] */0;
        }
      };
    };
    return find_in_bucket(Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey)));
  };
  var replace = function (h, key, info) {
    var hkey = Curry._2(hash, h[/* seed */2], key);
    var i = key_index(h, hkey);
    var l = Caml_array.caml_array_get(h[/* data */1], i);
    try {
      var _param = l;
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal(c, key);
            if (match !== 0) {
              _param = next;
              continue ;
            } else {
              return set_key_data(c, key, info);
            }
          } else {
            _param = next;
            continue ;
          }
        } else {
          throw Caml_builtin_exceptions.not_found;
        }
      };
    }
    catch (exn){
      if (exn === Caml_builtin_exceptions.not_found) {
        var container = create(key, info);
        Caml_array.caml_array_set(h[/* data */1], i, /* Cons */[
              hkey,
              container,
              l
            ]);
        h[/* size */0] = h[/* size */0] + 1 | 0;
        if (h[/* size */0] > (h[/* data */1].length << 1)) {
          return resize(h);
        } else {
          return 0;
        }
      } else {
        throw exn;
      }
    }
  };
  var mem = function (h, key) {
    var hkey = Curry._2(hash, h[/* seed */2], key);
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        if (param[0] === hkey) {
          var match = equal(param[1], key);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            return true;
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return false;
      }
    };
  };
  var iter = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              Curry._2(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1));
            }
            
          }
          _param = param[2];
          continue ;
        } else {
          return /* () */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      do_bucket(Caml_array.caml_array_get(d, i));
    }
    return /* () */0;
  };
  var fold = function (f, h, init) {
    var do_bucket = function (_b, _accu) {
      while(true) {
        var accu = _accu;
        var b = _b;
        if (b) {
          var c = b[1];
          var match = get_key(c);
          var match$1 = get_data(c);
          var accu$1 = match !== undefined && match$1 !== undefined ? Curry._3(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1), accu) : accu;
          _accu = accu$1;
          _b = b[2];
          continue ;
        } else {
          return accu;
        }
      };
    };
    var d = h[/* data */1];
    var accu = init;
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      accu = do_bucket(Caml_array.caml_array_get(d, i), accu);
    }
    return accu;
  };
  var filter_map_inplace = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              var k = Caml_option.valFromOption(match);
              var match$2 = Curry._2(f, k, Caml_option.valFromOption(match$1));
              if (match$2 !== undefined) {
                set_key_data(c, k, Caml_option.valFromOption(match$2));
                return /* Cons */[
                        param[0],
                        c,
                        do_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            } else {
              _param = rest;
              continue ;
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var length = function (h) {
    return h[/* size */0];
  };
  var bucket_length = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        _param = param[2];
        _accu = accu + 1 | 0;
        continue ;
      } else {
        return accu;
      }
    };
  };
  var stats = function (h) {
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length(0, b);
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */h[/* size */0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  var bucket_length_alive = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        var rest = param[2];
        if (check_key(param[1])) {
          _param = rest;
          _accu = accu + 1 | 0;
          continue ;
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return accu;
      }
    };
  };
  var stats_alive = function (h) {
    var size = /* record */[/* contents */0];
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length_alive(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length_alive(0, b);
            size[0] = size[0] + l | 0;
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */size[0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  return {
          create: create$1,
          clear: clear,
          reset: reset,
          copy: copy,
          add: add,
          remove: remove,
          find: find,
          find_opt: find_opt,
          find_all: find_all,
          replace: replace,
          mem: mem,
          iter: iter,
          filter_map_inplace: filter_map_inplace,
          fold: fold,
          length: length,
          stats: stats,
          clean: clean,
          stats_alive: stats_alive
        };
}

function Make(H) {
  var equal = H.equal;
  var hash = function (_seed, x) {
    return Curry._1(H.hash, x);
  };
  var create = function (k, d) {
    var c = Obj.Ephemeron.create(1);
    Obj.Ephemeron.set_data(c, d);
    set_key(c, k);
    return c;
  };
  var equal$1 = function (c, k) {
    var match = Obj.Ephemeron.get_key(c, 0);
    if (match !== undefined) {
      if (Curry._2(equal, k, Caml_option.valFromOption(match))) {
        return /* ETrue */0;
      } else {
        return /* EFalse */1;
      }
    } else {
      return /* EDead */2;
    }
  };
  var set_key_data = function (c, k, d) {
    Obj.Ephemeron.unset_data(c);
    set_key(c, k);
    return Obj.Ephemeron.set_data(c, d);
  };
  var power_2_above = function (_x, n) {
    while(true) {
      var x = _x;
      if (x >= n || (x << 1) > Sys.max_array_length) {
        return x;
      } else {
        _x = (x << 1);
        continue ;
      }
    };
  };
  var prng = Caml_obj.caml_lazy_make((function (param) {
          return Random.State.make_self_init(/* () */0);
        }));
  var clear = function (h) {
    h[/* size */0] = 0;
    var len = h[/* data */1].length;
    for(var i = 0 ,i_finish = len - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(h[/* data */1], i, /* Empty */0);
    }
    return /* () */0;
  };
  var reset = function (h) {
    var len = h[/* data */1].length;
    if (len === h[/* initial_size */3]) {
      return clear(h);
    } else {
      h[/* size */0] = 0;
      h[/* data */1] = Caml_array.caml_make_vect(h[/* initial_size */3], /* Empty */0);
      return /* () */0;
    }
  };
  var copy = function (h) {
    return /* record */[
            /* size */h[/* size */0],
            /* data */$$Array.copy(h[/* data */1]),
            /* seed */h[/* seed */2],
            /* initial_size */h[/* initial_size */3]
          ];
  };
  var key_index = function (h, hkey) {
    return hkey & (h[/* data */1].length - 1 | 0);
  };
  var clean = function (h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (check_key(c)) {
            return /* Cons */[
                    param[0],
                    c,
                    do_bucket(rest)
                  ];
          } else {
            h[/* size */0] = h[/* size */0] - 1 | 0;
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var resize = function (h) {
    var odata = h[/* data */1];
    var osize = odata.length;
    var nsize = (osize << 1);
    clean(h);
    if (nsize < Sys.max_array_length && h[/* size */0] >= (osize >>> 1)) {
      var ndata = Caml_array.caml_make_vect(nsize, /* Empty */0);
      h[/* data */1] = ndata;
      var insert_bucket = function (param) {
        if (param) {
          var hkey = param[0];
          insert_bucket(param[2]);
          var nidx = key_index(h, hkey);
          return Caml_array.caml_array_set(ndata, nidx, /* Cons */[
                      hkey,
                      param[1],
                      Caml_array.caml_array_get(ndata, nidx)
                    ]);
        } else {
          return /* () */0;
        }
      };
      for(var i = 0 ,i_finish = osize - 1 | 0; i <= i_finish; ++i){
        insert_bucket(Caml_array.caml_array_get(odata, i));
      }
      return /* () */0;
    } else {
      return 0;
    }
  };
  var add = function (h, key, info) {
    var hkey = hash(h[/* seed */2], key);
    var i = key_index(h, hkey);
    var container = create(key, info);
    var bucket_002 = Caml_array.caml_array_get(h[/* data */1], i);
    var bucket = /* Cons */[
      hkey,
      container,
      bucket_002
    ];
    Caml_array.caml_array_set(h[/* data */1], i, bucket);
    h[/* size */0] = h[/* size */0] + 1 | 0;
    if (h[/* size */0] > (h[/* data */1].length << 1)) {
      return resize(h);
    } else {
      return 0;
    }
  };
  var remove = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var remove_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          var hk = param[0];
          if (hkey === hk) {
            var match = equal$1(c, key);
            switch (match) {
              case /* ETrue */0 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  return next;
              case /* EFalse */1 :
                  return /* Cons */[
                          hk,
                          c,
                          remove_bucket(next)
                        ];
              case /* EDead */2 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  _param = next;
                  continue ;
              
            }
          } else {
            return /* Cons */[
                    hk,
                    c,
                    remove_bucket(next)
                  ];
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var i = key_index(h, hkey);
    return Caml_array.caml_array_set(h[/* data */1], i, remove_bucket(Caml_array.caml_array_get(h[/* data */1], i)));
  };
  var find = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal$1(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var match$1 = get_data(c);
            if (match$1 !== undefined) {
              return Caml_option.valFromOption(match$1);
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var find_opt = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal$1(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var d = get_data(c);
            if (d !== undefined) {
              return d;
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return ;
      }
    };
  };
  var find_all = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var find_in_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal$1(c, key);
            if (match !== 0) {
              _param = rest;
              continue ;
            } else {
              var match$1 = get_data(c);
              if (match$1 !== undefined) {
                return /* :: */[
                        Caml_option.valFromOption(match$1),
                        find_in_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* [] */0;
        }
      };
    };
    return find_in_bucket(Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey)));
  };
  var replace = function (h, key, info) {
    var hkey = hash(h[/* seed */2], key);
    var i = key_index(h, hkey);
    var l = Caml_array.caml_array_get(h[/* data */1], i);
    try {
      var _param = l;
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal$1(c, key);
            if (match !== 0) {
              _param = next;
              continue ;
            } else {
              return set_key_data(c, key, info);
            }
          } else {
            _param = next;
            continue ;
          }
        } else {
          throw Caml_builtin_exceptions.not_found;
        }
      };
    }
    catch (exn){
      if (exn === Caml_builtin_exceptions.not_found) {
        var container = create(key, info);
        Caml_array.caml_array_set(h[/* data */1], i, /* Cons */[
              hkey,
              container,
              l
            ]);
        h[/* size */0] = h[/* size */0] + 1 | 0;
        if (h[/* size */0] > (h[/* data */1].length << 1)) {
          return resize(h);
        } else {
          return 0;
        }
      } else {
        throw exn;
      }
    }
  };
  var mem = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        if (param[0] === hkey) {
          var match = equal$1(param[1], key);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            return true;
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return false;
      }
    };
  };
  var iter = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              Curry._2(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1));
            }
            
          }
          _param = param[2];
          continue ;
        } else {
          return /* () */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      do_bucket(Caml_array.caml_array_get(d, i));
    }
    return /* () */0;
  };
  var fold = function (f, h, init) {
    var do_bucket = function (_b, _accu) {
      while(true) {
        var accu = _accu;
        var b = _b;
        if (b) {
          var c = b[1];
          var match = get_key(c);
          var match$1 = get_data(c);
          var accu$1 = match !== undefined && match$1 !== undefined ? Curry._3(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1), accu) : accu;
          _accu = accu$1;
          _b = b[2];
          continue ;
        } else {
          return accu;
        }
      };
    };
    var d = h[/* data */1];
    var accu = init;
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      accu = do_bucket(Caml_array.caml_array_get(d, i), accu);
    }
    return accu;
  };
  var filter_map_inplace = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              var k = Caml_option.valFromOption(match);
              var match$2 = Curry._2(f, k, Caml_option.valFromOption(match$1));
              if (match$2 !== undefined) {
                set_key_data(c, k, Caml_option.valFromOption(match$2));
                return /* Cons */[
                        param[0],
                        c,
                        do_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            } else {
              _param = rest;
              continue ;
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var length = function (h) {
    return h[/* size */0];
  };
  var bucket_length = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        _param = param[2];
        _accu = accu + 1 | 0;
        continue ;
      } else {
        return accu;
      }
    };
  };
  var stats = function (h) {
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length(0, b);
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */h[/* size */0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  var bucket_length_alive = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        var rest = param[2];
        if (check_key(param[1])) {
          _param = rest;
          _accu = accu + 1 | 0;
          continue ;
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return accu;
      }
    };
  };
  var stats_alive = function (h) {
    var size = /* record */[/* contents */0];
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length_alive(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length_alive(0, b);
            size[0] = size[0] + l | 0;
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */size[0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  var create$1 = function (sz) {
    var $staropt$star = false;
    var initial_size = sz;
    var random = $staropt$star !== undefined ? $staropt$star : Hashtbl.is_randomized(/* () */0);
    var s = power_2_above(16, initial_size);
    var seed = random ? Random.State.bits(CamlinternalLazy.force(prng)) : 0;
    return /* record */[
            /* size */0,
            /* data */Caml_array.caml_make_vect(s, /* Empty */0),
            /* seed */seed,
            /* initial_size */s
          ];
  };
  return {
          create: create$1,
          clear: clear,
          reset: reset,
          copy: copy,
          add: add,
          remove: remove,
          find: find,
          find_opt: find_opt,
          find_all: find_all,
          replace: replace,
          mem: mem,
          iter: iter,
          filter_map_inplace: filter_map_inplace,
          fold: fold,
          length: length,
          stats: stats,
          clean: clean,
          stats_alive: stats_alive
        };
}

function create$1(param) {
  return Obj.Ephemeron.create(2);
}

function get_key1(t) {
  return Obj.Ephemeron.get_key(t, 0);
}

function get_key1_copy(t) {
  return Obj.Ephemeron.get_key_copy(t, 0);
}

function set_key1(t, k) {
  return Obj.Ephemeron.set_key(t, 0, k);
}

function unset_key1(t) {
  return Obj.Ephemeron.unset_key(t, 0);
}

function check_key1(t) {
  return Obj.Ephemeron.check_key(t, 0);
}

function get_key2(t) {
  return Obj.Ephemeron.get_key(t, 1);
}

function get_key2_copy(t) {
  return Obj.Ephemeron.get_key_copy(t, 1);
}

function set_key2(t, k) {
  return Obj.Ephemeron.set_key(t, 1, k);
}

function unset_key2(t) {
  return Obj.Ephemeron.unset_key(t, 1);
}

function check_key2(t) {
  return Obj.Ephemeron.check_key(t, 1);
}

function blit_key1(t1, t2) {
  return Obj.Ephemeron.blit_key(t1, 0, t2, 0, 1);
}

function blit_key2(t1, t2) {
  return Obj.Ephemeron.blit_key(t1, 1, t2, 1, 1);
}

function blit_key12(t1, t2) {
  return Obj.Ephemeron.blit_key(t1, 0, t2, 0, 2);
}

function get_data$1(t) {
  return Obj.Ephemeron.get_data(t);
}

function get_data_copy$1(t) {
  return Obj.Ephemeron.get_data_copy(t);
}

function set_data$1(t, d) {
  return Obj.Ephemeron.set_data(t, d);
}

function unset_data$1(t) {
  return Obj.Ephemeron.unset_data(t);
}

function check_data$1(t) {
  return Obj.Ephemeron.check_data(t);
}

function blit_data$1(t1, t2) {
  return Obj.Ephemeron.blit_data(t1, t2);
}

function MakeSeeded$1(H1, H2) {
  var create = function (param, d) {
    var c = Obj.Ephemeron.create(2);
    Obj.Ephemeron.set_data(c, d);
    set_key1(c, param[0]);
    set_key2(c, param[1]);
    return c;
  };
  var hash = function (seed, param) {
    return Curry._2(H1.hash, seed, param[0]) + Caml_int32.imul(Curry._2(H2.hash, seed, param[1]), 65599) | 0;
  };
  var equal = function (c, param) {
    var match = Obj.Ephemeron.get_key(c, 0);
    var match$1 = Obj.Ephemeron.get_key(c, 1);
    if (match !== undefined && match$1 !== undefined) {
      if (Curry._2(H1.equal, param[0], Caml_option.valFromOption(match)) && Curry._2(H2.equal, param[1], Caml_option.valFromOption(match$1))) {
        return /* ETrue */0;
      } else {
        return /* EFalse */1;
      }
    } else {
      return /* EDead */2;
    }
  };
  var get_key = function (c) {
    var match = Obj.Ephemeron.get_key(c, 0);
    var match$1 = Obj.Ephemeron.get_key(c, 1);
    if (match !== undefined && match$1 !== undefined) {
      return /* tuple */[
              Caml_option.valFromOption(match),
              Caml_option.valFromOption(match$1)
            ];
    }
    
  };
  var set_key_data = function (c, param, d) {
    Obj.Ephemeron.unset_data(c);
    set_key1(c, param[0]);
    set_key2(c, param[1]);
    return Obj.Ephemeron.set_data(c, d);
  };
  var check_key = function (c) {
    if (Obj.Ephemeron.check_key(c, 0)) {
      return Obj.Ephemeron.check_key(c, 1);
    } else {
      return false;
    }
  };
  var power_2_above = function (_x, n) {
    while(true) {
      var x = _x;
      if (x >= n || (x << 1) > Sys.max_array_length) {
        return x;
      } else {
        _x = (x << 1);
        continue ;
      }
    };
  };
  var prng = Caml_obj.caml_lazy_make((function (param) {
          return Random.State.make_self_init(/* () */0);
        }));
  var create$1 = function ($staropt$star, initial_size) {
    var random = $staropt$star !== undefined ? $staropt$star : Hashtbl.is_randomized(/* () */0);
    var s = power_2_above(16, initial_size);
    var seed = random ? Random.State.bits(CamlinternalLazy.force(prng)) : 0;
    return /* record */[
            /* size */0,
            /* data */Caml_array.caml_make_vect(s, /* Empty */0),
            /* seed */seed,
            /* initial_size */s
          ];
  };
  var clear = function (h) {
    h[/* size */0] = 0;
    var len = h[/* data */1].length;
    for(var i = 0 ,i_finish = len - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(h[/* data */1], i, /* Empty */0);
    }
    return /* () */0;
  };
  var reset = function (h) {
    var len = h[/* data */1].length;
    if (len === h[/* initial_size */3]) {
      return clear(h);
    } else {
      h[/* size */0] = 0;
      h[/* data */1] = Caml_array.caml_make_vect(h[/* initial_size */3], /* Empty */0);
      return /* () */0;
    }
  };
  var copy = function (h) {
    return /* record */[
            /* size */h[/* size */0],
            /* data */$$Array.copy(h[/* data */1]),
            /* seed */h[/* seed */2],
            /* initial_size */h[/* initial_size */3]
          ];
  };
  var key_index = function (h, hkey) {
    return hkey & (h[/* data */1].length - 1 | 0);
  };
  var clean = function (h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (check_key(c)) {
            return /* Cons */[
                    param[0],
                    c,
                    do_bucket(rest)
                  ];
          } else {
            h[/* size */0] = h[/* size */0] - 1 | 0;
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var resize = function (h) {
    var odata = h[/* data */1];
    var osize = odata.length;
    var nsize = (osize << 1);
    clean(h);
    if (nsize < Sys.max_array_length && h[/* size */0] >= (osize >>> 1)) {
      var ndata = Caml_array.caml_make_vect(nsize, /* Empty */0);
      h[/* data */1] = ndata;
      var insert_bucket = function (param) {
        if (param) {
          var hkey = param[0];
          insert_bucket(param[2]);
          var nidx = key_index(h, hkey);
          return Caml_array.caml_array_set(ndata, nidx, /* Cons */[
                      hkey,
                      param[1],
                      Caml_array.caml_array_get(ndata, nidx)
                    ]);
        } else {
          return /* () */0;
        }
      };
      for(var i = 0 ,i_finish = osize - 1 | 0; i <= i_finish; ++i){
        insert_bucket(Caml_array.caml_array_get(odata, i));
      }
      return /* () */0;
    } else {
      return 0;
    }
  };
  var add = function (h, key, info) {
    var hkey = hash(h[/* seed */2], key);
    var i = key_index(h, hkey);
    var container = create(key, info);
    var bucket_002 = Caml_array.caml_array_get(h[/* data */1], i);
    var bucket = /* Cons */[
      hkey,
      container,
      bucket_002
    ];
    Caml_array.caml_array_set(h[/* data */1], i, bucket);
    h[/* size */0] = h[/* size */0] + 1 | 0;
    if (h[/* size */0] > (h[/* data */1].length << 1)) {
      return resize(h);
    } else {
      return 0;
    }
  };
  var remove = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var remove_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          var hk = param[0];
          if (hkey === hk) {
            var match = equal(c, key);
            switch (match) {
              case /* ETrue */0 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  return next;
              case /* EFalse */1 :
                  return /* Cons */[
                          hk,
                          c,
                          remove_bucket(next)
                        ];
              case /* EDead */2 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  _param = next;
                  continue ;
              
            }
          } else {
            return /* Cons */[
                    hk,
                    c,
                    remove_bucket(next)
                  ];
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var i = key_index(h, hkey);
    return Caml_array.caml_array_set(h[/* data */1], i, remove_bucket(Caml_array.caml_array_get(h[/* data */1], i)));
  };
  var find = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var match$1 = get_data$1(c);
            if (match$1 !== undefined) {
              return Caml_option.valFromOption(match$1);
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var find_opt = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var d = get_data$1(c);
            if (d !== undefined) {
              return d;
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return ;
      }
    };
  };
  var find_all = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var find_in_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal(c, key);
            if (match !== 0) {
              _param = rest;
              continue ;
            } else {
              var match$1 = get_data$1(c);
              if (match$1 !== undefined) {
                return /* :: */[
                        Caml_option.valFromOption(match$1),
                        find_in_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* [] */0;
        }
      };
    };
    return find_in_bucket(Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey)));
  };
  var replace = function (h, key, info) {
    var hkey = hash(h[/* seed */2], key);
    var i = key_index(h, hkey);
    var l = Caml_array.caml_array_get(h[/* data */1], i);
    try {
      var _param = l;
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal(c, key);
            if (match !== 0) {
              _param = next;
              continue ;
            } else {
              return set_key_data(c, key, info);
            }
          } else {
            _param = next;
            continue ;
          }
        } else {
          throw Caml_builtin_exceptions.not_found;
        }
      };
    }
    catch (exn){
      if (exn === Caml_builtin_exceptions.not_found) {
        var container = create(key, info);
        Caml_array.caml_array_set(h[/* data */1], i, /* Cons */[
              hkey,
              container,
              l
            ]);
        h[/* size */0] = h[/* size */0] + 1 | 0;
        if (h[/* size */0] > (h[/* data */1].length << 1)) {
          return resize(h);
        } else {
          return 0;
        }
      } else {
        throw exn;
      }
    }
  };
  var mem = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        if (param[0] === hkey) {
          var match = equal(param[1], key);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            return true;
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return false;
      }
    };
  };
  var iter = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data$1(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              Curry._2(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1));
            }
            
          }
          _param = param[2];
          continue ;
        } else {
          return /* () */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      do_bucket(Caml_array.caml_array_get(d, i));
    }
    return /* () */0;
  };
  var fold = function (f, h, init) {
    var do_bucket = function (_b, _accu) {
      while(true) {
        var accu = _accu;
        var b = _b;
        if (b) {
          var c = b[1];
          var match = get_key(c);
          var match$1 = get_data$1(c);
          var accu$1 = match !== undefined && match$1 !== undefined ? Curry._3(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1), accu) : accu;
          _accu = accu$1;
          _b = b[2];
          continue ;
        } else {
          return accu;
        }
      };
    };
    var d = h[/* data */1];
    var accu = init;
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      accu = do_bucket(Caml_array.caml_array_get(d, i), accu);
    }
    return accu;
  };
  var filter_map_inplace = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data$1(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              var k = Caml_option.valFromOption(match);
              var match$2 = Curry._2(f, k, Caml_option.valFromOption(match$1));
              if (match$2 !== undefined) {
                set_key_data(c, k, Caml_option.valFromOption(match$2));
                return /* Cons */[
                        param[0],
                        c,
                        do_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            } else {
              _param = rest;
              continue ;
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var length = function (h) {
    return h[/* size */0];
  };
  var bucket_length = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        _param = param[2];
        _accu = accu + 1 | 0;
        continue ;
      } else {
        return accu;
      }
    };
  };
  var stats = function (h) {
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length(0, b);
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */h[/* size */0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  var bucket_length_alive = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        var rest = param[2];
        if (check_key(param[1])) {
          _param = rest;
          _accu = accu + 1 | 0;
          continue ;
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return accu;
      }
    };
  };
  var stats_alive = function (h) {
    var size = /* record */[/* contents */0];
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length_alive(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length_alive(0, b);
            size[0] = size[0] + l | 0;
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */size[0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  return {
          create: create$1,
          clear: clear,
          reset: reset,
          copy: copy,
          add: add,
          remove: remove,
          find: find,
          find_opt: find_opt,
          find_all: find_all,
          replace: replace,
          mem: mem,
          iter: iter,
          filter_map_inplace: filter_map_inplace,
          fold: fold,
          length: length,
          stats: stats,
          clean: clean,
          stats_alive: stats_alive
        };
}

function Make$1(H1, H2) {
  var equal = H1.equal;
  var hash = function (_seed, x) {
    return Curry._1(H1.hash, x);
  };
  var equal$1 = H2.equal;
  var hash$1 = function (_seed, x) {
    return Curry._1(H2.hash, x);
  };
  var include = (function (param) {
        var create = function (param, d) {
          var c = Obj.Ephemeron.create(2);
          Obj.Ephemeron.set_data(c, d);
          set_key1(c, param[0]);
          set_key2(c, param[1]);
          return c;
        };
        var hash$2 = function (seed, param$1) {
          return Curry._2(hash, seed, param$1[0]) + Caml_int32.imul(Curry._2(param.hash, seed, param$1[1]), 65599) | 0;
        };
        var equal$2 = function (c, param$1) {
          var match = Obj.Ephemeron.get_key(c, 0);
          var match$1 = Obj.Ephemeron.get_key(c, 1);
          if (match !== undefined && match$1 !== undefined) {
            if (Curry._2(equal, param$1[0], Caml_option.valFromOption(match)) && Curry._2(param.equal, param$1[1], Caml_option.valFromOption(match$1))) {
              return /* ETrue */0;
            } else {
              return /* EFalse */1;
            }
          } else {
            return /* EDead */2;
          }
        };
        var get_key = function (c) {
          var match = Obj.Ephemeron.get_key(c, 0);
          var match$1 = Obj.Ephemeron.get_key(c, 1);
          if (match !== undefined && match$1 !== undefined) {
            return /* tuple */[
                    Caml_option.valFromOption(match),
                    Caml_option.valFromOption(match$1)
                  ];
          }
          
        };
        var set_key_data = function (c, param, d) {
          Obj.Ephemeron.unset_data(c);
          set_key1(c, param[0]);
          set_key2(c, param[1]);
          return Obj.Ephemeron.set_data(c, d);
        };
        var check_key = function (c) {
          if (Obj.Ephemeron.check_key(c, 0)) {
            return Obj.Ephemeron.check_key(c, 1);
          } else {
            return false;
          }
        };
        var power_2_above = function (_x, n) {
          while(true) {
            var x = _x;
            if (x >= n || (x << 1) > Sys.max_array_length) {
              return x;
            } else {
              _x = (x << 1);
              continue ;
            }
          };
        };
        var prng = Caml_obj.caml_lazy_make((function (param) {
                return Random.State.make_self_init(/* () */0);
              }));
        var create$1 = function ($staropt$star, initial_size) {
          var random = $staropt$star !== undefined ? $staropt$star : Hashtbl.is_randomized(/* () */0);
          var s = power_2_above(16, initial_size);
          var seed = random ? Random.State.bits(CamlinternalLazy.force(prng)) : 0;
          return /* record */[
                  /* size */0,
                  /* data */Caml_array.caml_make_vect(s, /* Empty */0),
                  /* seed */seed,
                  /* initial_size */s
                ];
        };
        var clear = function (h) {
          h[/* size */0] = 0;
          var len = h[/* data */1].length;
          for(var i = 0 ,i_finish = len - 1 | 0; i <= i_finish; ++i){
            Caml_array.caml_array_set(h[/* data */1], i, /* Empty */0);
          }
          return /* () */0;
        };
        var reset = function (h) {
          var len = h[/* data */1].length;
          if (len === h[/* initial_size */3]) {
            return clear(h);
          } else {
            h[/* size */0] = 0;
            h[/* data */1] = Caml_array.caml_make_vect(h[/* initial_size */3], /* Empty */0);
            return /* () */0;
          }
        };
        var copy = function (h) {
          return /* record */[
                  /* size */h[/* size */0],
                  /* data */$$Array.copy(h[/* data */1]),
                  /* seed */h[/* seed */2],
                  /* initial_size */h[/* initial_size */3]
                ];
        };
        var key_index = function (h, hkey) {
          return hkey & (h[/* data */1].length - 1 | 0);
        };
        var clean = function (h) {
          var do_bucket = function (_param) {
            while(true) {
              var param = _param;
              if (param) {
                var rest = param[2];
                var c = param[1];
                if (Curry._1(check_key, c)) {
                  return /* Cons */[
                          param[0],
                          c,
                          do_bucket(rest)
                        ];
                } else {
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  _param = rest;
                  continue ;
                }
              } else {
                return /* Empty */0;
              }
            };
          };
          var d = h[/* data */1];
          for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
            Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
          }
          return /* () */0;
        };
        var resize = function (h) {
          var odata = h[/* data */1];
          var osize = odata.length;
          var nsize = (osize << 1);
          clean(h);
          if (nsize < Sys.max_array_length && h[/* size */0] >= (osize >>> 1)) {
            var ndata = Caml_array.caml_make_vect(nsize, /* Empty */0);
            h[/* data */1] = ndata;
            var insert_bucket = function (param) {
              if (param) {
                var hkey = param[0];
                insert_bucket(param[2]);
                var nidx = key_index(h, hkey);
                return Caml_array.caml_array_set(ndata, nidx, /* Cons */[
                            hkey,
                            param[1],
                            Caml_array.caml_array_get(ndata, nidx)
                          ]);
              } else {
                return /* () */0;
              }
            };
            for(var i = 0 ,i_finish = osize - 1 | 0; i <= i_finish; ++i){
              insert_bucket(Caml_array.caml_array_get(odata, i));
            }
            return /* () */0;
          } else {
            return 0;
          }
        };
        var add = function (h, key, info) {
          var hkey = Curry._2(hash$2, h[/* seed */2], key);
          var i = key_index(h, hkey);
          var container = Curry._2(create, key, info);
          var bucket_002 = Caml_array.caml_array_get(h[/* data */1], i);
          var bucket = /* Cons */[
            hkey,
            container,
            bucket_002
          ];
          Caml_array.caml_array_set(h[/* data */1], i, bucket);
          h[/* size */0] = h[/* size */0] + 1 | 0;
          if (h[/* size */0] > (h[/* data */1].length << 1)) {
            return resize(h);
          } else {
            return 0;
          }
        };
        var remove = function (h, key) {
          var hkey = Curry._2(hash$2, h[/* seed */2], key);
          var remove_bucket = function (_param) {
            while(true) {
              var param = _param;
              if (param) {
                var next = param[2];
                var c = param[1];
                var hk = param[0];
                if (hkey === hk) {
                  var match = Curry._2(equal$2, c, key);
                  switch (match) {
                    case /* ETrue */0 :
                        h[/* size */0] = h[/* size */0] - 1 | 0;
                        return next;
                    case /* EFalse */1 :
                        return /* Cons */[
                                hk,
                                c,
                                remove_bucket(next)
                              ];
                    case /* EDead */2 :
                        h[/* size */0] = h[/* size */0] - 1 | 0;
                        _param = next;
                        continue ;
                    
                  }
                } else {
                  return /* Cons */[
                          hk,
                          c,
                          remove_bucket(next)
                        ];
                }
              } else {
                return /* Empty */0;
              }
            };
          };
          var i = key_index(h, hkey);
          return Caml_array.caml_array_set(h[/* data */1], i, remove_bucket(Caml_array.caml_array_get(h[/* data */1], i)));
        };
        var find = function (h, key) {
          var hkey = Curry._2(hash$2, h[/* seed */2], key);
          var key$1 = key;
          var hkey$1 = hkey;
          var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
          while(true) {
            var param = _param;
            if (param) {
              var rest = param[2];
              var c = param[1];
              if (hkey$1 === param[0]) {
                var match = Curry._2(equal$2, c, key$1);
                if (match !== 0) {
                  _param = rest;
                  continue ;
                } else {
                  var match$1 = Curry._1(get_data$1, c);
                  if (match$1 !== undefined) {
                    return Caml_option.valFromOption(match$1);
                  } else {
                    _param = rest;
                    continue ;
                  }
                }
              } else {
                _param = rest;
                continue ;
              }
            } else {
              throw Caml_builtin_exceptions.not_found;
            }
          };
        };
        var find_opt = function (h, key) {
          var hkey = Curry._2(hash$2, h[/* seed */2], key);
          var key$1 = key;
          var hkey$1 = hkey;
          var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
          while(true) {
            var param = _param;
            if (param) {
              var rest = param[2];
              var c = param[1];
              if (hkey$1 === param[0]) {
                var match = Curry._2(equal$2, c, key$1);
                if (match !== 0) {
                  _param = rest;
                  continue ;
                } else {
                  var d = Curry._1(get_data$1, c);
                  if (d !== undefined) {
                    return d;
                  } else {
                    _param = rest;
                    continue ;
                  }
                }
              } else {
                _param = rest;
                continue ;
              }
            } else {
              return ;
            }
          };
        };
        var find_all = function (h, key) {
          var hkey = Curry._2(hash$2, h[/* seed */2], key);
          var find_in_bucket = function (_param) {
            while(true) {
              var param = _param;
              if (param) {
                var rest = param[2];
                var c = param[1];
                if (hkey === param[0]) {
                  var match = Curry._2(equal$2, c, key);
                  if (match !== 0) {
                    _param = rest;
                    continue ;
                  } else {
                    var match$1 = Curry._1(get_data$1, c);
                    if (match$1 !== undefined) {
                      return /* :: */[
                              Caml_option.valFromOption(match$1),
                              find_in_bucket(rest)
                            ];
                    } else {
                      _param = rest;
                      continue ;
                    }
                  }
                } else {
                  _param = rest;
                  continue ;
                }
              } else {
                return /* [] */0;
              }
            };
          };
          return find_in_bucket(Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey)));
        };
        var replace = function (h, key, info) {
          var hkey = Curry._2(hash$2, h[/* seed */2], key);
          var i = key_index(h, hkey);
          var l = Caml_array.caml_array_get(h[/* data */1], i);
          try {
            var _param = l;
            while(true) {
              var param = _param;
              if (param) {
                var next = param[2];
                var c = param[1];
                if (hkey === param[0]) {
                  var match = Curry._2(equal$2, c, key);
                  if (match !== 0) {
                    _param = next;
                    continue ;
                  } else {
                    return Curry._3(set_key_data, c, key, info);
                  }
                } else {
                  _param = next;
                  continue ;
                }
              } else {
                throw Caml_builtin_exceptions.not_found;
              }
            };
          }
          catch (exn){
            if (exn === Caml_builtin_exceptions.not_found) {
              var container = Curry._2(create, key, info);
              Caml_array.caml_array_set(h[/* data */1], i, /* Cons */[
                    hkey,
                    container,
                    l
                  ]);
              h[/* size */0] = h[/* size */0] + 1 | 0;
              if (h[/* size */0] > (h[/* data */1].length << 1)) {
                return resize(h);
              } else {
                return 0;
              }
            } else {
              throw exn;
            }
          }
        };
        var mem = function (h, key) {
          var hkey = Curry._2(hash$2, h[/* seed */2], key);
          var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
          while(true) {
            var param = _param;
            if (param) {
              var rest = param[2];
              if (param[0] === hkey) {
                var match = Curry._2(equal$2, param[1], key);
                if (match !== 0) {
                  _param = rest;
                  continue ;
                } else {
                  return true;
                }
              } else {
                _param = rest;
                continue ;
              }
            } else {
              return false;
            }
          };
        };
        var iter = function (f, h) {
          var do_bucket = function (_param) {
            while(true) {
              var param = _param;
              if (param) {
                var c = param[1];
                var match = Curry._1(get_key, c);
                var match$1 = Curry._1(get_data$1, c);
                if (match !== undefined) {
                  if (match$1 !== undefined) {
                    Curry._2(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1));
                  }
                  
                }
                _param = param[2];
                continue ;
              } else {
                return /* () */0;
              }
            };
          };
          var d = h[/* data */1];
          for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
            do_bucket(Caml_array.caml_array_get(d, i));
          }
          return /* () */0;
        };
        var fold = function (f, h, init) {
          var do_bucket = function (_b, _accu) {
            while(true) {
              var accu = _accu;
              var b = _b;
              if (b) {
                var c = b[1];
                var match = Curry._1(get_key, c);
                var match$1 = Curry._1(get_data$1, c);
                var accu$1 = match !== undefined && match$1 !== undefined ? Curry._3(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1), accu) : accu;
                _accu = accu$1;
                _b = b[2];
                continue ;
              } else {
                return accu;
              }
            };
          };
          var d = h[/* data */1];
          var accu = init;
          for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
            accu = do_bucket(Caml_array.caml_array_get(d, i), accu);
          }
          return accu;
        };
        var filter_map_inplace = function (f, h) {
          var do_bucket = function (_param) {
            while(true) {
              var param = _param;
              if (param) {
                var rest = param[2];
                var c = param[1];
                var match = Curry._1(get_key, c);
                var match$1 = Curry._1(get_data$1, c);
                if (match !== undefined) {
                  if (match$1 !== undefined) {
                    var k = Caml_option.valFromOption(match);
                    var match$2 = Curry._2(f, k, Caml_option.valFromOption(match$1));
                    if (match$2 !== undefined) {
                      Curry._3(set_key_data, c, k, Caml_option.valFromOption(match$2));
                      return /* Cons */[
                              param[0],
                              c,
                              do_bucket(rest)
                            ];
                    } else {
                      _param = rest;
                      continue ;
                    }
                  } else {
                    _param = rest;
                    continue ;
                  }
                } else {
                  _param = rest;
                  continue ;
                }
              } else {
                return /* Empty */0;
              }
            };
          };
          var d = h[/* data */1];
          for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
            Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
          }
          return /* () */0;
        };
        var length = function (h) {
          return h[/* size */0];
        };
        var bucket_length = function (_accu, _param) {
          while(true) {
            var param = _param;
            var accu = _accu;
            if (param) {
              _param = param[2];
              _accu = accu + 1 | 0;
              continue ;
            } else {
              return accu;
            }
          };
        };
        var stats = function (h) {
          var mbl = $$Array.fold_left((function (m, b) {
                  return Caml_primitive.caml_int_max(m, bucket_length(0, b));
                }), 0, h[/* data */1]);
          var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
          $$Array.iter((function (b) {
                  var l = bucket_length(0, b);
                  return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
                }), h[/* data */1]);
          return /* record */[
                  /* num_bindings */h[/* size */0],
                  /* num_buckets */h[/* data */1].length,
                  /* max_bucket_length */mbl,
                  /* bucket_histogram */histo
                ];
        };
        var bucket_length_alive = function (_accu, _param) {
          while(true) {
            var param = _param;
            var accu = _accu;
            if (param) {
              var rest = param[2];
              if (Curry._1(check_key, param[1])) {
                _param = rest;
                _accu = accu + 1 | 0;
                continue ;
              } else {
                _param = rest;
                continue ;
              }
            } else {
              return accu;
            }
          };
        };
        var stats_alive = function (h) {
          var size = /* record */[/* contents */0];
          var mbl = $$Array.fold_left((function (m, b) {
                  return Caml_primitive.caml_int_max(m, bucket_length_alive(0, b));
                }), 0, h[/* data */1]);
          var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
          $$Array.iter((function (b) {
                  var l = bucket_length_alive(0, b);
                  size[0] = size[0] + l | 0;
                  return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
                }), h[/* data */1]);
          return /* record */[
                  /* num_bindings */size[0],
                  /* num_buckets */h[/* data */1].length,
                  /* max_bucket_length */mbl,
                  /* bucket_histogram */histo
                ];
        };
        return {
                create: create$1,
                clear: clear,
                reset: reset,
                copy: copy,
                add: add,
                remove: remove,
                find: find,
                find_opt: find_opt,
                find_all: find_all,
                replace: replace,
                mem: mem,
                iter: iter,
                filter_map_inplace: filter_map_inplace,
                fold: fold,
                length: length,
                stats: stats,
                clean: clean,
                stats_alive: stats_alive
              };
      })({
        equal: equal$1,
        hash: hash$1
      });
  var create = include.create;
  var create$1 = function (sz) {
    return Curry._2(create, false, sz);
  };
  return {
          create: create$1,
          clear: include.clear,
          reset: include.reset,
          copy: include.copy,
          add: include.add,
          remove: include.remove,
          find: include.find,
          find_opt: include.find_opt,
          find_all: include.find_all,
          replace: include.replace,
          mem: include.mem,
          iter: include.iter,
          filter_map_inplace: include.filter_map_inplace,
          fold: include.fold,
          length: include.length,
          stats: include.stats,
          clean: include.clean,
          stats_alive: include.stats_alive
        };
}

function create$2(n) {
  return Obj.Ephemeron.create(n);
}

function get_key$1(t, n) {
  return Obj.Ephemeron.get_key(t, n);
}

function get_key_copy$1(t, n) {
  return Obj.Ephemeron.get_key_copy(t, n);
}

function set_key$1(t, n, k) {
  return Obj.Ephemeron.set_key(t, n, k);
}

function unset_key$1(t, n) {
  return Obj.Ephemeron.unset_key(t, n);
}

function check_key$1(t, n) {
  return Obj.Ephemeron.check_key(t, n);
}

function blit_key$1(t1, o1, t2, o2, l) {
  return Obj.Ephemeron.blit_key(t1, o1, t2, o2, l);
}

function get_data$2(t) {
  return Obj.Ephemeron.get_data(t);
}

function get_data_copy$2(t) {
  return Obj.Ephemeron.get_data_copy(t);
}

function set_data$2(t, d) {
  return Obj.Ephemeron.set_data(t, d);
}

function unset_data$2(t) {
  return Obj.Ephemeron.unset_data(t);
}

function check_data$2(t) {
  return Obj.Ephemeron.check_data(t);
}

function blit_data$2(t1, t2) {
  return Obj.Ephemeron.blit_data(t1, t2);
}

function MakeSeeded$2(H) {
  var create = function (k, d) {
    var c = Obj.Ephemeron.create(k.length);
    Obj.Ephemeron.set_data(c, d);
    for(var i = 0 ,i_finish = k.length - 1 | 0; i <= i_finish; ++i){
      set_key$1(c, i, Caml_array.caml_array_get(k, i));
    }
    return c;
  };
  var hash = function (seed, k) {
    var h = 0;
    for(var i = 0 ,i_finish = k.length - 1 | 0; i <= i_finish; ++i){
      h = Caml_int32.imul(Curry._2(H.hash, seed, Caml_array.caml_array_get(k, i)), 65599) + h | 0;
    }
    return h;
  };
  var equal = function (c, k) {
    var len = k.length;
    var len$prime = Obj.Ephemeron.length(c);
    if (len !== len$prime) {
      return /* EFalse */1;
    } else {
      var k$1 = k;
      var c$1 = c;
      var _i = len - 1 | 0;
      while(true) {
        var i = _i;
        if (i < 0) {
          return /* ETrue */0;
        } else {
          var match = Obj.Ephemeron.get_key(c$1, i);
          if (match !== undefined) {
            if (Curry._2(H.equal, Caml_array.caml_array_get(k$1, i), Caml_option.valFromOption(match))) {
              _i = i - 1 | 0;
              continue ;
            } else {
              return /* EFalse */1;
            }
          } else {
            return /* EDead */2;
          }
        }
      };
    }
  };
  var get_key = function (c) {
    var len = Obj.Ephemeron.length(c);
    if (len === 0) {
      return /* array */[];
    } else {
      var match = Obj.Ephemeron.get_key(c, 0);
      if (match !== undefined) {
        var a = Caml_array.caml_make_vect(len, Caml_option.valFromOption(match));
        var a$1 = a;
        var _i = len - 1 | 0;
        while(true) {
          var i = _i;
          if (i < 1) {
            return a$1;
          } else {
            var match$1 = Obj.Ephemeron.get_key(c, i);
            if (match$1 !== undefined) {
              Caml_array.caml_array_set(a$1, i, Caml_option.valFromOption(match$1));
              _i = i - 1 | 0;
              continue ;
            } else {
              return ;
            }
          }
        };
      } else {
        return ;
      }
    }
  };
  var set_key_data = function (c, k, d) {
    Obj.Ephemeron.unset_data(c);
    for(var i = 0 ,i_finish = k.length - 1 | 0; i <= i_finish; ++i){
      set_key$1(c, i, Caml_array.caml_array_get(k, i));
    }
    return Obj.Ephemeron.set_data(c, d);
  };
  var check_key = function (c) {
    var c$1 = c;
    var _i = Obj.Ephemeron.length(c) - 1 | 0;
    while(true) {
      var i = _i;
      if (i < 0) {
        return true;
      } else if (Obj.Ephemeron.check_key(c$1, i)) {
        _i = i - 1 | 0;
        continue ;
      } else {
        return false;
      }
    };
  };
  var power_2_above = function (_x, n) {
    while(true) {
      var x = _x;
      if (x >= n || (x << 1) > Sys.max_array_length) {
        return x;
      } else {
        _x = (x << 1);
        continue ;
      }
    };
  };
  var prng = Caml_obj.caml_lazy_make((function (param) {
          return Random.State.make_self_init(/* () */0);
        }));
  var create$1 = function ($staropt$star, initial_size) {
    var random = $staropt$star !== undefined ? $staropt$star : Hashtbl.is_randomized(/* () */0);
    var s = power_2_above(16, initial_size);
    var seed = random ? Random.State.bits(CamlinternalLazy.force(prng)) : 0;
    return /* record */[
            /* size */0,
            /* data */Caml_array.caml_make_vect(s, /* Empty */0),
            /* seed */seed,
            /* initial_size */s
          ];
  };
  var clear = function (h) {
    h[/* size */0] = 0;
    var len = h[/* data */1].length;
    for(var i = 0 ,i_finish = len - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(h[/* data */1], i, /* Empty */0);
    }
    return /* () */0;
  };
  var reset = function (h) {
    var len = h[/* data */1].length;
    if (len === h[/* initial_size */3]) {
      return clear(h);
    } else {
      h[/* size */0] = 0;
      h[/* data */1] = Caml_array.caml_make_vect(h[/* initial_size */3], /* Empty */0);
      return /* () */0;
    }
  };
  var copy = function (h) {
    return /* record */[
            /* size */h[/* size */0],
            /* data */$$Array.copy(h[/* data */1]),
            /* seed */h[/* seed */2],
            /* initial_size */h[/* initial_size */3]
          ];
  };
  var key_index = function (h, hkey) {
    return hkey & (h[/* data */1].length - 1 | 0);
  };
  var clean = function (h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (check_key(c)) {
            return /* Cons */[
                    param[0],
                    c,
                    do_bucket(rest)
                  ];
          } else {
            h[/* size */0] = h[/* size */0] - 1 | 0;
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var resize = function (h) {
    var odata = h[/* data */1];
    var osize = odata.length;
    var nsize = (osize << 1);
    clean(h);
    if (nsize < Sys.max_array_length && h[/* size */0] >= (osize >>> 1)) {
      var ndata = Caml_array.caml_make_vect(nsize, /* Empty */0);
      h[/* data */1] = ndata;
      var insert_bucket = function (param) {
        if (param) {
          var hkey = param[0];
          insert_bucket(param[2]);
          var nidx = key_index(h, hkey);
          return Caml_array.caml_array_set(ndata, nidx, /* Cons */[
                      hkey,
                      param[1],
                      Caml_array.caml_array_get(ndata, nidx)
                    ]);
        } else {
          return /* () */0;
        }
      };
      for(var i = 0 ,i_finish = osize - 1 | 0; i <= i_finish; ++i){
        insert_bucket(Caml_array.caml_array_get(odata, i));
      }
      return /* () */0;
    } else {
      return 0;
    }
  };
  var add = function (h, key, info) {
    var hkey = hash(h[/* seed */2], key);
    var i = key_index(h, hkey);
    var container = create(key, info);
    var bucket_002 = Caml_array.caml_array_get(h[/* data */1], i);
    var bucket = /* Cons */[
      hkey,
      container,
      bucket_002
    ];
    Caml_array.caml_array_set(h[/* data */1], i, bucket);
    h[/* size */0] = h[/* size */0] + 1 | 0;
    if (h[/* size */0] > (h[/* data */1].length << 1)) {
      return resize(h);
    } else {
      return 0;
    }
  };
  var remove = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var remove_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          var hk = param[0];
          if (hkey === hk) {
            var match = equal(c, key);
            switch (match) {
              case /* ETrue */0 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  return next;
              case /* EFalse */1 :
                  return /* Cons */[
                          hk,
                          c,
                          remove_bucket(next)
                        ];
              case /* EDead */2 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  _param = next;
                  continue ;
              
            }
          } else {
            return /* Cons */[
                    hk,
                    c,
                    remove_bucket(next)
                  ];
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var i = key_index(h, hkey);
    return Caml_array.caml_array_set(h[/* data */1], i, remove_bucket(Caml_array.caml_array_get(h[/* data */1], i)));
  };
  var find = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var match$1 = get_data$2(c);
            if (match$1 !== undefined) {
              return Caml_option.valFromOption(match$1);
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var find_opt = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var d = get_data$2(c);
            if (d !== undefined) {
              return d;
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return ;
      }
    };
  };
  var find_all = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var find_in_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal(c, key);
            if (match !== 0) {
              _param = rest;
              continue ;
            } else {
              var match$1 = get_data$2(c);
              if (match$1 !== undefined) {
                return /* :: */[
                        Caml_option.valFromOption(match$1),
                        find_in_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* [] */0;
        }
      };
    };
    return find_in_bucket(Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey)));
  };
  var replace = function (h, key, info) {
    var hkey = hash(h[/* seed */2], key);
    var i = key_index(h, hkey);
    var l = Caml_array.caml_array_get(h[/* data */1], i);
    try {
      var _param = l;
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal(c, key);
            if (match !== 0) {
              _param = next;
              continue ;
            } else {
              return set_key_data(c, key, info);
            }
          } else {
            _param = next;
            continue ;
          }
        } else {
          throw Caml_builtin_exceptions.not_found;
        }
      };
    }
    catch (exn){
      if (exn === Caml_builtin_exceptions.not_found) {
        var container = create(key, info);
        Caml_array.caml_array_set(h[/* data */1], i, /* Cons */[
              hkey,
              container,
              l
            ]);
        h[/* size */0] = h[/* size */0] + 1 | 0;
        if (h[/* size */0] > (h[/* data */1].length << 1)) {
          return resize(h);
        } else {
          return 0;
        }
      } else {
        throw exn;
      }
    }
  };
  var mem = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        if (param[0] === hkey) {
          var match = equal(param[1], key);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            return true;
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return false;
      }
    };
  };
  var iter = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data$2(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              Curry._2(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1));
            }
            
          }
          _param = param[2];
          continue ;
        } else {
          return /* () */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      do_bucket(Caml_array.caml_array_get(d, i));
    }
    return /* () */0;
  };
  var fold = function (f, h, init) {
    var do_bucket = function (_b, _accu) {
      while(true) {
        var accu = _accu;
        var b = _b;
        if (b) {
          var c = b[1];
          var match = get_key(c);
          var match$1 = get_data$2(c);
          var accu$1 = match !== undefined && match$1 !== undefined ? Curry._3(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1), accu) : accu;
          _accu = accu$1;
          _b = b[2];
          continue ;
        } else {
          return accu;
        }
      };
    };
    var d = h[/* data */1];
    var accu = init;
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      accu = do_bucket(Caml_array.caml_array_get(d, i), accu);
    }
    return accu;
  };
  var filter_map_inplace = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data$2(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              var k = Caml_option.valFromOption(match);
              var match$2 = Curry._2(f, k, Caml_option.valFromOption(match$1));
              if (match$2 !== undefined) {
                set_key_data(c, k, Caml_option.valFromOption(match$2));
                return /* Cons */[
                        param[0],
                        c,
                        do_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            } else {
              _param = rest;
              continue ;
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var length = function (h) {
    return h[/* size */0];
  };
  var bucket_length = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        _param = param[2];
        _accu = accu + 1 | 0;
        continue ;
      } else {
        return accu;
      }
    };
  };
  var stats = function (h) {
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length(0, b);
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */h[/* size */0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  var bucket_length_alive = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        var rest = param[2];
        if (check_key(param[1])) {
          _param = rest;
          _accu = accu + 1 | 0;
          continue ;
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return accu;
      }
    };
  };
  var stats_alive = function (h) {
    var size = /* record */[/* contents */0];
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length_alive(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length_alive(0, b);
            size[0] = size[0] + l | 0;
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */size[0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  return {
          create: create$1,
          clear: clear,
          reset: reset,
          copy: copy,
          add: add,
          remove: remove,
          find: find,
          find_opt: find_opt,
          find_all: find_all,
          replace: replace,
          mem: mem,
          iter: iter,
          filter_map_inplace: filter_map_inplace,
          fold: fold,
          length: length,
          stats: stats,
          clean: clean,
          stats_alive: stats_alive
        };
}

function Make$2(H) {
  var equal = H.equal;
  var create = function (k, d) {
    var c = Obj.Ephemeron.create(k.length);
    Obj.Ephemeron.set_data(c, d);
    for(var i = 0 ,i_finish = k.length - 1 | 0; i <= i_finish; ++i){
      set_key$1(c, i, Caml_array.caml_array_get(k, i));
    }
    return c;
  };
  var hash = function (seed, k) {
    var h = 0;
    for(var i = 0 ,i_finish = k.length - 1 | 0; i <= i_finish; ++i){
      h = Caml_int32.imul(Curry._1(H.hash, Caml_array.caml_array_get(k, i)), 65599) + h | 0;
    }
    return h;
  };
  var equal$1 = function (c, k) {
    var len = k.length;
    var len$prime = Obj.Ephemeron.length(c);
    if (len !== len$prime) {
      return /* EFalse */1;
    } else {
      var k$1 = k;
      var c$1 = c;
      var _i = len - 1 | 0;
      while(true) {
        var i = _i;
        if (i < 0) {
          return /* ETrue */0;
        } else {
          var match = Obj.Ephemeron.get_key(c$1, i);
          if (match !== undefined) {
            if (Curry._2(equal, Caml_array.caml_array_get(k$1, i), Caml_option.valFromOption(match))) {
              _i = i - 1 | 0;
              continue ;
            } else {
              return /* EFalse */1;
            }
          } else {
            return /* EDead */2;
          }
        }
      };
    }
  };
  var get_key = function (c) {
    var len = Obj.Ephemeron.length(c);
    if (len === 0) {
      return /* array */[];
    } else {
      var match = Obj.Ephemeron.get_key(c, 0);
      if (match !== undefined) {
        var a = Caml_array.caml_make_vect(len, Caml_option.valFromOption(match));
        var a$1 = a;
        var _i = len - 1 | 0;
        while(true) {
          var i = _i;
          if (i < 1) {
            return a$1;
          } else {
            var match$1 = Obj.Ephemeron.get_key(c, i);
            if (match$1 !== undefined) {
              Caml_array.caml_array_set(a$1, i, Caml_option.valFromOption(match$1));
              _i = i - 1 | 0;
              continue ;
            } else {
              return ;
            }
          }
        };
      } else {
        return ;
      }
    }
  };
  var set_key_data = function (c, k, d) {
    Obj.Ephemeron.unset_data(c);
    for(var i = 0 ,i_finish = k.length - 1 | 0; i <= i_finish; ++i){
      set_key$1(c, i, Caml_array.caml_array_get(k, i));
    }
    return Obj.Ephemeron.set_data(c, d);
  };
  var check_key = function (c) {
    var c$1 = c;
    var _i = Obj.Ephemeron.length(c) - 1 | 0;
    while(true) {
      var i = _i;
      if (i < 0) {
        return true;
      } else if (Obj.Ephemeron.check_key(c$1, i)) {
        _i = i - 1 | 0;
        continue ;
      } else {
        return false;
      }
    };
  };
  var power_2_above = function (_x, n) {
    while(true) {
      var x = _x;
      if (x >= n || (x << 1) > Sys.max_array_length) {
        return x;
      } else {
        _x = (x << 1);
        continue ;
      }
    };
  };
  var prng = Caml_obj.caml_lazy_make((function (param) {
          return Random.State.make_self_init(/* () */0);
        }));
  var clear = function (h) {
    h[/* size */0] = 0;
    var len = h[/* data */1].length;
    for(var i = 0 ,i_finish = len - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(h[/* data */1], i, /* Empty */0);
    }
    return /* () */0;
  };
  var reset = function (h) {
    var len = h[/* data */1].length;
    if (len === h[/* initial_size */3]) {
      return clear(h);
    } else {
      h[/* size */0] = 0;
      h[/* data */1] = Caml_array.caml_make_vect(h[/* initial_size */3], /* Empty */0);
      return /* () */0;
    }
  };
  var copy = function (h) {
    return /* record */[
            /* size */h[/* size */0],
            /* data */$$Array.copy(h[/* data */1]),
            /* seed */h[/* seed */2],
            /* initial_size */h[/* initial_size */3]
          ];
  };
  var key_index = function (h, hkey) {
    return hkey & (h[/* data */1].length - 1 | 0);
  };
  var clean = function (h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (check_key(c)) {
            return /* Cons */[
                    param[0],
                    c,
                    do_bucket(rest)
                  ];
          } else {
            h[/* size */0] = h[/* size */0] - 1 | 0;
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var resize = function (h) {
    var odata = h[/* data */1];
    var osize = odata.length;
    var nsize = (osize << 1);
    clean(h);
    if (nsize < Sys.max_array_length && h[/* size */0] >= (osize >>> 1)) {
      var ndata = Caml_array.caml_make_vect(nsize, /* Empty */0);
      h[/* data */1] = ndata;
      var insert_bucket = function (param) {
        if (param) {
          var hkey = param[0];
          insert_bucket(param[2]);
          var nidx = key_index(h, hkey);
          return Caml_array.caml_array_set(ndata, nidx, /* Cons */[
                      hkey,
                      param[1],
                      Caml_array.caml_array_get(ndata, nidx)
                    ]);
        } else {
          return /* () */0;
        }
      };
      for(var i = 0 ,i_finish = osize - 1 | 0; i <= i_finish; ++i){
        insert_bucket(Caml_array.caml_array_get(odata, i));
      }
      return /* () */0;
    } else {
      return 0;
    }
  };
  var add = function (h, key, info) {
    var hkey = hash(h[/* seed */2], key);
    var i = key_index(h, hkey);
    var container = create(key, info);
    var bucket_002 = Caml_array.caml_array_get(h[/* data */1], i);
    var bucket = /* Cons */[
      hkey,
      container,
      bucket_002
    ];
    Caml_array.caml_array_set(h[/* data */1], i, bucket);
    h[/* size */0] = h[/* size */0] + 1 | 0;
    if (h[/* size */0] > (h[/* data */1].length << 1)) {
      return resize(h);
    } else {
      return 0;
    }
  };
  var remove = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var remove_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          var hk = param[0];
          if (hkey === hk) {
            var match = equal$1(c, key);
            switch (match) {
              case /* ETrue */0 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  return next;
              case /* EFalse */1 :
                  return /* Cons */[
                          hk,
                          c,
                          remove_bucket(next)
                        ];
              case /* EDead */2 :
                  h[/* size */0] = h[/* size */0] - 1 | 0;
                  _param = next;
                  continue ;
              
            }
          } else {
            return /* Cons */[
                    hk,
                    c,
                    remove_bucket(next)
                  ];
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var i = key_index(h, hkey);
    return Caml_array.caml_array_set(h[/* data */1], i, remove_bucket(Caml_array.caml_array_get(h[/* data */1], i)));
  };
  var find = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal$1(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var match$1 = get_data$2(c);
            if (match$1 !== undefined) {
              return Caml_option.valFromOption(match$1);
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        throw Caml_builtin_exceptions.not_found;
      }
    };
  };
  var find_opt = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var key$1 = key;
    var hkey$1 = hkey;
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        var c = param[1];
        if (hkey$1 === param[0]) {
          var match = equal$1(c, key$1);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            var d = get_data$2(c);
            if (d !== undefined) {
              return d;
            } else {
              _param = rest;
              continue ;
            }
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return ;
      }
    };
  };
  var find_all = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var find_in_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal$1(c, key);
            if (match !== 0) {
              _param = rest;
              continue ;
            } else {
              var match$1 = get_data$2(c);
              if (match$1 !== undefined) {
                return /* :: */[
                        Caml_option.valFromOption(match$1),
                        find_in_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* [] */0;
        }
      };
    };
    return find_in_bucket(Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey)));
  };
  var replace = function (h, key, info) {
    var hkey = hash(h[/* seed */2], key);
    var i = key_index(h, hkey);
    var l = Caml_array.caml_array_get(h[/* data */1], i);
    try {
      var _param = l;
      while(true) {
        var param = _param;
        if (param) {
          var next = param[2];
          var c = param[1];
          if (hkey === param[0]) {
            var match = equal$1(c, key);
            if (match !== 0) {
              _param = next;
              continue ;
            } else {
              return set_key_data(c, key, info);
            }
          } else {
            _param = next;
            continue ;
          }
        } else {
          throw Caml_builtin_exceptions.not_found;
        }
      };
    }
    catch (exn){
      if (exn === Caml_builtin_exceptions.not_found) {
        var container = create(key, info);
        Caml_array.caml_array_set(h[/* data */1], i, /* Cons */[
              hkey,
              container,
              l
            ]);
        h[/* size */0] = h[/* size */0] + 1 | 0;
        if (h[/* size */0] > (h[/* data */1].length << 1)) {
          return resize(h);
        } else {
          return 0;
        }
      } else {
        throw exn;
      }
    }
  };
  var mem = function (h, key) {
    var hkey = hash(h[/* seed */2], key);
    var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
    while(true) {
      var param = _param;
      if (param) {
        var rest = param[2];
        if (param[0] === hkey) {
          var match = equal$1(param[1], key);
          if (match !== 0) {
            _param = rest;
            continue ;
          } else {
            return true;
          }
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return false;
      }
    };
  };
  var iter = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data$2(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              Curry._2(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1));
            }
            
          }
          _param = param[2];
          continue ;
        } else {
          return /* () */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      do_bucket(Caml_array.caml_array_get(d, i));
    }
    return /* () */0;
  };
  var fold = function (f, h, init) {
    var do_bucket = function (_b, _accu) {
      while(true) {
        var accu = _accu;
        var b = _b;
        if (b) {
          var c = b[1];
          var match = get_key(c);
          var match$1 = get_data$2(c);
          var accu$1 = match !== undefined && match$1 !== undefined ? Curry._3(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1), accu) : accu;
          _accu = accu$1;
          _b = b[2];
          continue ;
        } else {
          return accu;
        }
      };
    };
    var d = h[/* data */1];
    var accu = init;
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      accu = do_bucket(Caml_array.caml_array_get(d, i), accu);
    }
    return accu;
  };
  var filter_map_inplace = function (f, h) {
    var do_bucket = function (_param) {
      while(true) {
        var param = _param;
        if (param) {
          var rest = param[2];
          var c = param[1];
          var match = get_key(c);
          var match$1 = get_data$2(c);
          if (match !== undefined) {
            if (match$1 !== undefined) {
              var k = Caml_option.valFromOption(match);
              var match$2 = Curry._2(f, k, Caml_option.valFromOption(match$1));
              if (match$2 !== undefined) {
                set_key_data(c, k, Caml_option.valFromOption(match$2));
                return /* Cons */[
                        param[0],
                        c,
                        do_bucket(rest)
                      ];
              } else {
                _param = rest;
                continue ;
              }
            } else {
              _param = rest;
              continue ;
            }
          } else {
            _param = rest;
            continue ;
          }
        } else {
          return /* Empty */0;
        }
      };
    };
    var d = h[/* data */1];
    for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
      Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
    }
    return /* () */0;
  };
  var length = function (h) {
    return h[/* size */0];
  };
  var bucket_length = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        _param = param[2];
        _accu = accu + 1 | 0;
        continue ;
      } else {
        return accu;
      }
    };
  };
  var stats = function (h) {
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length(0, b);
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */h[/* size */0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  var bucket_length_alive = function (_accu, _param) {
    while(true) {
      var param = _param;
      var accu = _accu;
      if (param) {
        var rest = param[2];
        if (check_key(param[1])) {
          _param = rest;
          _accu = accu + 1 | 0;
          continue ;
        } else {
          _param = rest;
          continue ;
        }
      } else {
        return accu;
      }
    };
  };
  var stats_alive = function (h) {
    var size = /* record */[/* contents */0];
    var mbl = $$Array.fold_left((function (m, b) {
            return Caml_primitive.caml_int_max(m, bucket_length_alive(0, b));
          }), 0, h[/* data */1]);
    var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
    $$Array.iter((function (b) {
            var l = bucket_length_alive(0, b);
            size[0] = size[0] + l | 0;
            return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
          }), h[/* data */1]);
    return /* record */[
            /* num_bindings */size[0],
            /* num_buckets */h[/* data */1].length,
            /* max_bucket_length */mbl,
            /* bucket_histogram */histo
          ];
  };
  var create$1 = function (sz) {
    var $staropt$star = false;
    var initial_size = sz;
    var random = $staropt$star !== undefined ? $staropt$star : Hashtbl.is_randomized(/* () */0);
    var s = power_2_above(16, initial_size);
    var seed = random ? Random.State.bits(CamlinternalLazy.force(prng)) : 0;
    return /* record */[
            /* size */0,
            /* data */Caml_array.caml_make_vect(s, /* Empty */0),
            /* seed */seed,
            /* initial_size */s
          ];
  };
  return {
          create: create$1,
          clear: clear,
          reset: reset,
          copy: copy,
          add: add,
          remove: remove,
          find: find,
          find_opt: find_opt,
          find_all: find_all,
          replace: replace,
          mem: mem,
          iter: iter,
          filter_map_inplace: filter_map_inplace,
          fold: fold,
          length: length,
          stats: stats,
          clean: clean,
          stats_alive: stats_alive
        };
}

var K1 = {
  create: create,
  get_key: get_key,
  get_key_copy: get_key_copy,
  set_key: set_key,
  unset_key: unset_key,
  check_key: check_key,
  blit_key: blit_key,
  get_data: get_data,
  get_data_copy: get_data_copy,
  set_data: set_data,
  unset_data: unset_data,
  check_data: check_data,
  blit_data: blit_data,
  Make: Make,
  MakeSeeded: MakeSeeded
};

var K2 = {
  create: create$1,
  get_key1: get_key1,
  get_key1_copy: get_key1_copy,
  set_key1: set_key1,
  unset_key1: unset_key1,
  check_key1: check_key1,
  get_key2: get_key2,
  get_key2_copy: get_key2_copy,
  set_key2: set_key2,
  unset_key2: unset_key2,
  check_key2: check_key2,
  blit_key1: blit_key1,
  blit_key2: blit_key2,
  blit_key12: blit_key12,
  get_data: get_data$1,
  get_data_copy: get_data_copy$1,
  set_data: set_data$1,
  unset_data: unset_data$1,
  check_data: check_data$1,
  blit_data: blit_data$1,
  Make: Make$1,
  MakeSeeded: MakeSeeded$1
};

var Kn = {
  create: create$2,
  get_key: get_key$1,
  get_key_copy: get_key_copy$1,
  set_key: set_key$1,
  unset_key: unset_key$1,
  check_key: check_key$1,
  blit_key: blit_key$1,
  get_data: get_data$2,
  get_data_copy: get_data_copy$2,
  set_data: set_data$2,
  unset_data: unset_data$2,
  check_data: check_data$2,
  blit_data: blit_data$2,
  Make: Make$2,
  MakeSeeded: MakeSeeded$2
};

var GenHashTable = {
  MakeSeeded: (function (funarg) {
      var H_create = funarg.create;
      var H_hash = funarg.hash;
      var H_equal = funarg.equal;
      var H_get_data = funarg.get_data;
      var H_get_key = funarg.get_key;
      var H_set_key_data = funarg.set_key_data;
      var H_check_key = funarg.check_key;
      var power_2_above = function (_x, n) {
        while(true) {
          var x = _x;
          if (x >= n || (x << 1) > Sys.max_array_length) {
            return x;
          } else {
            _x = (x << 1);
            continue ;
          }
        };
      };
      var prng = Caml_obj.caml_lazy_make((function (param) {
              return Random.State.make_self_init(/* () */0);
            }));
      var create = function ($staropt$star, initial_size) {
        var random = $staropt$star !== undefined ? $staropt$star : Hashtbl.is_randomized(/* () */0);
        var s = power_2_above(16, initial_size);
        var seed = random ? Random.State.bits(CamlinternalLazy.force(prng)) : 0;
        return /* record */[
                /* size */0,
                /* data */Caml_array.caml_make_vect(s, /* Empty */0),
                /* seed */seed,
                /* initial_size */s
              ];
      };
      var clear = function (h) {
        h[/* size */0] = 0;
        var len = h[/* data */1].length;
        for(var i = 0 ,i_finish = len - 1 | 0; i <= i_finish; ++i){
          Caml_array.caml_array_set(h[/* data */1], i, /* Empty */0);
        }
        return /* () */0;
      };
      var reset = function (h) {
        var len = h[/* data */1].length;
        if (len === h[/* initial_size */3]) {
          return clear(h);
        } else {
          h[/* size */0] = 0;
          h[/* data */1] = Caml_array.caml_make_vect(h[/* initial_size */3], /* Empty */0);
          return /* () */0;
        }
      };
      var copy = function (h) {
        return /* record */[
                /* size */h[/* size */0],
                /* data */$$Array.copy(h[/* data */1]),
                /* seed */h[/* seed */2],
                /* initial_size */h[/* initial_size */3]
              ];
      };
      var key_index = function (h, hkey) {
        return hkey & (h[/* data */1].length - 1 | 0);
      };
      var clean = function (h) {
        var do_bucket = function (_param) {
          while(true) {
            var param = _param;
            if (param) {
              var rest = param[2];
              var c = param[1];
              if (Curry._1(H_check_key, c)) {
                return /* Cons */[
                        param[0],
                        c,
                        do_bucket(rest)
                      ];
              } else {
                h[/* size */0] = h[/* size */0] - 1 | 0;
                _param = rest;
                continue ;
              }
            } else {
              return /* Empty */0;
            }
          };
        };
        var d = h[/* data */1];
        for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
          Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
        }
        return /* () */0;
      };
      var resize = function (h) {
        var odata = h[/* data */1];
        var osize = odata.length;
        var nsize = (osize << 1);
        clean(h);
        if (nsize < Sys.max_array_length && h[/* size */0] >= (osize >>> 1)) {
          var ndata = Caml_array.caml_make_vect(nsize, /* Empty */0);
          h[/* data */1] = ndata;
          var insert_bucket = function (param) {
            if (param) {
              var hkey = param[0];
              insert_bucket(param[2]);
              var nidx = key_index(h, hkey);
              return Caml_array.caml_array_set(ndata, nidx, /* Cons */[
                          hkey,
                          param[1],
                          Caml_array.caml_array_get(ndata, nidx)
                        ]);
            } else {
              return /* () */0;
            }
          };
          for(var i = 0 ,i_finish = osize - 1 | 0; i <= i_finish; ++i){
            insert_bucket(Caml_array.caml_array_get(odata, i));
          }
          return /* () */0;
        } else {
          return 0;
        }
      };
      var add = function (h, key, info) {
        var hkey = Curry._2(H_hash, h[/* seed */2], key);
        var i = key_index(h, hkey);
        var container = Curry._2(H_create, key, info);
        var bucket_002 = Caml_array.caml_array_get(h[/* data */1], i);
        var bucket = /* Cons */[
          hkey,
          container,
          bucket_002
        ];
        Caml_array.caml_array_set(h[/* data */1], i, bucket);
        h[/* size */0] = h[/* size */0] + 1 | 0;
        if (h[/* size */0] > (h[/* data */1].length << 1)) {
          return resize(h);
        } else {
          return 0;
        }
      };
      var remove = function (h, key) {
        var hkey = Curry._2(H_hash, h[/* seed */2], key);
        var remove_bucket = function (_param) {
          while(true) {
            var param = _param;
            if (param) {
              var next = param[2];
              var c = param[1];
              var hk = param[0];
              if (hkey === hk) {
                var match = Curry._2(H_equal, c, key);
                switch (match) {
                  case /* ETrue */0 :
                      h[/* size */0] = h[/* size */0] - 1 | 0;
                      return next;
                  case /* EFalse */1 :
                      return /* Cons */[
                              hk,
                              c,
                              remove_bucket(next)
                            ];
                  case /* EDead */2 :
                      h[/* size */0] = h[/* size */0] - 1 | 0;
                      _param = next;
                      continue ;
                  
                }
              } else {
                return /* Cons */[
                        hk,
                        c,
                        remove_bucket(next)
                      ];
              }
            } else {
              return /* Empty */0;
            }
          };
        };
        var i = key_index(h, hkey);
        return Caml_array.caml_array_set(h[/* data */1], i, remove_bucket(Caml_array.caml_array_get(h[/* data */1], i)));
      };
      var find = function (h, key) {
        var hkey = Curry._2(H_hash, h[/* seed */2], key);
        var key$1 = key;
        var hkey$1 = hkey;
        var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
        while(true) {
          var param = _param;
          if (param) {
            var rest = param[2];
            var c = param[1];
            if (hkey$1 === param[0]) {
              var match = Curry._2(H_equal, c, key$1);
              if (match !== 0) {
                _param = rest;
                continue ;
              } else {
                var match$1 = Curry._1(H_get_data, c);
                if (match$1 !== undefined) {
                  return Caml_option.valFromOption(match$1);
                } else {
                  _param = rest;
                  continue ;
                }
              }
            } else {
              _param = rest;
              continue ;
            }
          } else {
            throw Caml_builtin_exceptions.not_found;
          }
        };
      };
      var find_opt = function (h, key) {
        var hkey = Curry._2(H_hash, h[/* seed */2], key);
        var key$1 = key;
        var hkey$1 = hkey;
        var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
        while(true) {
          var param = _param;
          if (param) {
            var rest = param[2];
            var c = param[1];
            if (hkey$1 === param[0]) {
              var match = Curry._2(H_equal, c, key$1);
              if (match !== 0) {
                _param = rest;
                continue ;
              } else {
                var d = Curry._1(H_get_data, c);
                if (d !== undefined) {
                  return d;
                } else {
                  _param = rest;
                  continue ;
                }
              }
            } else {
              _param = rest;
              continue ;
            }
          } else {
            return ;
          }
        };
      };
      var find_all = function (h, key) {
        var hkey = Curry._2(H_hash, h[/* seed */2], key);
        var find_in_bucket = function (_param) {
          while(true) {
            var param = _param;
            if (param) {
              var rest = param[2];
              var c = param[1];
              if (hkey === param[0]) {
                var match = Curry._2(H_equal, c, key);
                if (match !== 0) {
                  _param = rest;
                  continue ;
                } else {
                  var match$1 = Curry._1(H_get_data, c);
                  if (match$1 !== undefined) {
                    return /* :: */[
                            Caml_option.valFromOption(match$1),
                            find_in_bucket(rest)
                          ];
                  } else {
                    _param = rest;
                    continue ;
                  }
                }
              } else {
                _param = rest;
                continue ;
              }
            } else {
              return /* [] */0;
            }
          };
        };
        return find_in_bucket(Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey)));
      };
      var replace = function (h, key, info) {
        var hkey = Curry._2(H_hash, h[/* seed */2], key);
        var i = key_index(h, hkey);
        var l = Caml_array.caml_array_get(h[/* data */1], i);
        try {
          var _param = l;
          while(true) {
            var param = _param;
            if (param) {
              var next = param[2];
              var c = param[1];
              if (hkey === param[0]) {
                var match = Curry._2(H_equal, c, key);
                if (match !== 0) {
                  _param = next;
                  continue ;
                } else {
                  return Curry._3(H_set_key_data, c, key, info);
                }
              } else {
                _param = next;
                continue ;
              }
            } else {
              throw Caml_builtin_exceptions.not_found;
            }
          };
        }
        catch (exn){
          if (exn === Caml_builtin_exceptions.not_found) {
            var container = Curry._2(H_create, key, info);
            Caml_array.caml_array_set(h[/* data */1], i, /* Cons */[
                  hkey,
                  container,
                  l
                ]);
            h[/* size */0] = h[/* size */0] + 1 | 0;
            if (h[/* size */0] > (h[/* data */1].length << 1)) {
              return resize(h);
            } else {
              return 0;
            }
          } else {
            throw exn;
          }
        }
      };
      var mem = function (h, key) {
        var hkey = Curry._2(H_hash, h[/* seed */2], key);
        var _param = Caml_array.caml_array_get(h[/* data */1], key_index(h, hkey));
        while(true) {
          var param = _param;
          if (param) {
            var rest = param[2];
            if (param[0] === hkey) {
              var match = Curry._2(H_equal, param[1], key);
              if (match !== 0) {
                _param = rest;
                continue ;
              } else {
                return true;
              }
            } else {
              _param = rest;
              continue ;
            }
          } else {
            return false;
          }
        };
      };
      var iter = function (f, h) {
        var do_bucket = function (_param) {
          while(true) {
            var param = _param;
            if (param) {
              var c = param[1];
              var match = Curry._1(H_get_key, c);
              var match$1 = Curry._1(H_get_data, c);
              if (match !== undefined) {
                if (match$1 !== undefined) {
                  Curry._2(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1));
                }
                
              }
              _param = param[2];
              continue ;
            } else {
              return /* () */0;
            }
          };
        };
        var d = h[/* data */1];
        for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
          do_bucket(Caml_array.caml_array_get(d, i));
        }
        return /* () */0;
      };
      var fold = function (f, h, init) {
        var do_bucket = function (_b, _accu) {
          while(true) {
            var accu = _accu;
            var b = _b;
            if (b) {
              var c = b[1];
              var match = Curry._1(H_get_key, c);
              var match$1 = Curry._1(H_get_data, c);
              var accu$1 = match !== undefined && match$1 !== undefined ? Curry._3(f, Caml_option.valFromOption(match), Caml_option.valFromOption(match$1), accu) : accu;
              _accu = accu$1;
              _b = b[2];
              continue ;
            } else {
              return accu;
            }
          };
        };
        var d = h[/* data */1];
        var accu = init;
        for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
          accu = do_bucket(Caml_array.caml_array_get(d, i), accu);
        }
        return accu;
      };
      var filter_map_inplace = function (f, h) {
        var do_bucket = function (_param) {
          while(true) {
            var param = _param;
            if (param) {
              var rest = param[2];
              var c = param[1];
              var match = Curry._1(H_get_key, c);
              var match$1 = Curry._1(H_get_data, c);
              if (match !== undefined) {
                if (match$1 !== undefined) {
                  var k = Caml_option.valFromOption(match);
                  var match$2 = Curry._2(f, k, Caml_option.valFromOption(match$1));
                  if (match$2 !== undefined) {
                    Curry._3(H_set_key_data, c, k, Caml_option.valFromOption(match$2));
                    return /* Cons */[
                            param[0],
                            c,
                            do_bucket(rest)
                          ];
                  } else {
                    _param = rest;
                    continue ;
                  }
                } else {
                  _param = rest;
                  continue ;
                }
              } else {
                _param = rest;
                continue ;
              }
            } else {
              return /* Empty */0;
            }
          };
        };
        var d = h[/* data */1];
        for(var i = 0 ,i_finish = d.length - 1 | 0; i <= i_finish; ++i){
          Caml_array.caml_array_set(d, i, do_bucket(Caml_array.caml_array_get(d, i)));
        }
        return /* () */0;
      };
      var length = function (h) {
        return h[/* size */0];
      };
      var bucket_length = function (_accu, _param) {
        while(true) {
          var param = _param;
          var accu = _accu;
          if (param) {
            _param = param[2];
            _accu = accu + 1 | 0;
            continue ;
          } else {
            return accu;
          }
        };
      };
      var stats = function (h) {
        var mbl = $$Array.fold_left((function (m, b) {
                return Caml_primitive.caml_int_max(m, bucket_length(0, b));
              }), 0, h[/* data */1]);
        var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
        $$Array.iter((function (b) {
                var l = bucket_length(0, b);
                return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
              }), h[/* data */1]);
        return /* record */[
                /* num_bindings */h[/* size */0],
                /* num_buckets */h[/* data */1].length,
                /* max_bucket_length */mbl,
                /* bucket_histogram */histo
              ];
      };
      var bucket_length_alive = function (_accu, _param) {
        while(true) {
          var param = _param;
          var accu = _accu;
          if (param) {
            var rest = param[2];
            if (Curry._1(H_check_key, param[1])) {
              _param = rest;
              _accu = accu + 1 | 0;
              continue ;
            } else {
              _param = rest;
              continue ;
            }
          } else {
            return accu;
          }
        };
      };
      var stats_alive = function (h) {
        var size = /* record */[/* contents */0];
        var mbl = $$Array.fold_left((function (m, b) {
                return Caml_primitive.caml_int_max(m, bucket_length_alive(0, b));
              }), 0, h[/* data */1]);
        var histo = Caml_array.caml_make_vect(mbl + 1 | 0, 0);
        $$Array.iter((function (b) {
                var l = bucket_length_alive(0, b);
                size[0] = size[0] + l | 0;
                return Caml_array.caml_array_set(histo, l, Caml_array.caml_array_get(histo, l) + 1 | 0);
              }), h[/* data */1]);
        return /* record */[
                /* num_bindings */size[0],
                /* num_buckets */h[/* data */1].length,
                /* max_bucket_length */mbl,
                /* bucket_histogram */histo
              ];
      };
      return {
              create: create,
              clear: clear,
              reset: reset,
              copy: copy,
              add: add,
              remove: remove,
              find: find,
              find_opt: find_opt,
              find_all: find_all,
              replace: replace,
              mem: mem,
              iter: iter,
              filter_map_inplace: filter_map_inplace,
              fold: fold,
              length: length,
              stats: stats,
              clean: clean,
              stats_alive: stats_alive
            };
    })
};

exports.K1 = K1;
exports.K2 = K2;
exports.Kn = Kn;
exports.GenHashTable = GenHashTable;
/* No side effect */
