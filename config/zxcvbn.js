  var DICTIONARY_MATCHERS, GRAPHS, KEYBOARD_AVERAGE_DEGREE, KEYBOARD_STARTING_POSITIONS, KEYPAD_AVERAGE_DEGREE, KEYPAD_STARTING_POSITIONS, MATCHERS, calc_average_degree, k, ranked_user_inputs_dict, time, v, zxcvbn;

  ranked_user_inputs_dict = {};
  SINGLE_GUESS = .010;

  NUM_ATTACKERS = 100;

  SECONDS_PER_GUESS = SINGLE_GUESS / NUM_ATTACKERS;

  crack_time_to_score = function(seconds) {
      if (seconds < Math.pow(10, 2)) {
        return 0;
      }
      if (seconds < Math.pow(10, 4)) {
        return 1;
      }
      if (seconds < Math.pow(10, 6)) {
        return 2;
      }
      if (seconds < Math.pow(10, 8)) {
        return 3;
      }
      return 4;
    };

  display_time = function(seconds) {
      var century, day, hour, minute, month, year;
      minute = 60;
      hour = minute * 60;
      day = hour * 24;
      month = day * 31;
      year = month * 12;
      century = year * 100;
      if (seconds < minute) {
        return 'instant';
      } else if (seconds < hour) {
        return "" + (1 + Math.ceil(seconds / minute)) + " minutes";
      } else if (seconds < day) {
        return "" + (1 + Math.ceil(seconds / hour)) + " hours";
      } else if (seconds < month) {
        return "" + (1 + Math.ceil(seconds / day)) + " days";
      } else if (seconds < year) {
        return "" + (1 + Math.ceil(seconds / month)) + " months";
      } else if (seconds < century) {
        return "" + (1 + Math.ceil(seconds / year)) + " years";
      } else {
        return 'centuries';
      }
    };

  round_to_x_digits = function(n, x) {
      return Math.round(n * Math.pow(10, x)) / Math.pow(10, x);
    };

  lg = function(n) {
      return Math.log(n) / Math.log(2);
    };
  entropy_to_crack_time = function(entropy) {
      return .5 * Math.pow(2, entropy) * SECONDS_PER_GUESS;
    };

  calc_bruteforce_cardinality = function(password) {
      var c, chr, digits, lower, ord, symbols, upper, _i, _len, _ref, _ref1;
      _ref = [false, false, false, false], lower = _ref[0], upper = _ref[1], digits = _ref[2], symbols = _ref[3];
      _ref1 = password.split('');
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        chr = _ref1[_i];
        ord = chr.charCodeAt(0);
        if ((0x30 <= ord && ord <= 0x39)) {
          digits = true;
        } else if ((0x41 <= ord && ord <= 0x5a)) {
          upper = true;
        } else if ((0x61 <= ord && ord <= 0x7a)) {
          lower = true;
        } else {
          symbols = true;
        }
      }
      c = 0;
      if (digits) {
        c += 10;
      }
      if (upper) {
        c += 26;
      }
      if (lower) {
        c += 26;
      }
      if (symbols) {
        c += 33;
      }
      return c;
    };
  minimum_entropy_match_sequence = function(password, matches) {
      var backpointers, bruteforce_cardinality, candidate_entropy, crack_time, i, j, k, make_bruteforce_match, match, match_sequence, match_sequence_copy, min_entropy, up_to_k, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2;
      bruteforce_cardinality = calc_bruteforce_cardinality(password);
      up_to_k = [];
      backpointers = [];
      for (k = _i = 0, _ref = password.length; 0 <= _ref ? _i < _ref : _i > _ref; k = 0 <= _ref ? ++_i : --_i) {
        up_to_k[k] = (up_to_k[k - 1] || 0) + lg(bruteforce_cardinality);
        backpointers[k] = null;
        for (_j = 0, _len = matches.length; _j < _len; _j++) {
          match = matches[_j];
          if (!(match.j === k)) {
            continue;
          }
          _ref1 = [match.i, match.j], i = _ref1[0], j = _ref1[1];
          candidate_entropy = (up_to_k[i - 1] || 0) + calc_entropy(match);
          if (candidate_entropy < up_to_k[j]) {
            up_to_k[j] = candidate_entropy;
            backpointers[j] = match;
          }
        }
      }
      match_sequence = [];
      k = password.length - 1;
      while (k >= 0) {
        match = backpointers[k];
        if (match) {
          match_sequence.push(match);
          k = match.i - 1;
        } else {
          k -= 1;
        }
      }
      match_sequence.reverse();
      make_bruteforce_match = function(i, j) {
        return {
          pattern: 'bruteforce',
          i: i,
          j: j,
          token: password.slice(i, j + 1 || 9e9),
          entropy: lg(Math.pow(bruteforce_cardinality, j - i + 1)),
          cardinality: bruteforce_cardinality
        };
      };
      k = 0;
      match_sequence_copy = [];
      for (_k = 0, _len1 = match_sequence.length; _k < _len1; _k++) {
        match = match_sequence[_k];
        _ref2 = [match.i, match.j], i = _ref2[0], j = _ref2[1];
        if (i - k > 0) {
          match_sequence_copy.push(make_bruteforce_match(k, i - 1));
        }
        k = j + 1;
        match_sequence_copy.push(match);
      }
      if (k < password.length) {
        match_sequence_copy.push(make_bruteforce_match(k, password.length - 1));
      }
      match_sequence = match_sequence_copy;
      min_entropy = up_to_k[password.length - 1] || 0;
      crack_time = entropy_to_crack_time(min_entropy);
      return {
        password: password,
        entropy: round_to_x_digits(min_entropy, 3),
        match_sequence: match_sequence,
        crack_time: round_to_x_digits(crack_time, 3),
        crack_time_display: display_time(crack_time),
        score: crack_time_to_score(crack_time)
      };
    };

  empty = function(obj) {
      var k;
      return ((function() {
        var _results;
        _results = [];
        for (k in obj) {
          _results.push(k);
        }
        return _results;
      })()).length === 0;
    };

  var passwords = ["password", "123456", "12345678"];
  build_ranked_dict = function(unranked_list) {
      var i, result, word, _i, _len;
      result = {};
      i = 1;
      for (_i = 0, _len = unranked_list.length; _i < _len; _i++) {
        word = unranked_list[_i];
        result[word] = i;
        i += 1;
      }
      return result;
    };
  build_dict_matcher = function(dict_name, ranked_dict) {
      return function(password) {
        var match, matches, _i, _len;
        matches = dictionary_match(password, ranked_dict);
        for (_i = 0, _len = matches.length; _i < _len; _i++) {
          match = matches[_i];
          match.dictionary_name = dict_name;
        }
        return matches;
      };
    };
  var english = ["you", "i"];
  var male_names = ["John", "Peter"];
  var female_names = ["Laura", "Grabriela"];
  var surnames = ["Smith", "Johnson"];
  DICTIONARY_MATCHERS = [build_dict_matcher('passwords', build_ranked_dict(passwords)), build_dict_matcher('english', build_ranked_dict(english)), build_dict_matcher('male_names', build_ranked_dict(male_names)), build_dict_matcher('female_names', build_ranked_dict(female_names)), build_dict_matcher('surnames', build_ranked_dict(surnames)), build_dict_matcher('user_inputs', ranked_user_inputs_dict)];

  enumerate_l33t_subs = function(table) {
      var chr, dedup, helper, k, keys, l33t_chr, sub, sub_dict, sub_dicts, subs, _i, _j, _len, _len1, _ref;
      keys = (function() {
        var _results;
        _results = [];
        for (k in table) {
          _results.push(k);
        }
        return _results;
      })();
      subs = [[]];
      dedup = function(subs) {
        var assoc, deduped, label, members, sub, v, _i, _len;
        deduped = [];
        members = {};
        for (_i = 0, _len = subs.length; _i < _len; _i++) {
          sub = subs[_i];
          assoc = (function() {
            var _j, _len1, _results;
            _results = [];
            for (v = _j = 0, _len1 = sub.length; _j < _len1; v = ++_j) {
              k = sub[v];
              _results.push([k, v]);
            }
            return _results;
          })();
          assoc.sort();
          label = ((function() {
            var _j, _len1, _results;
            _results = [];
            for (v = _j = 0, _len1 = assoc.length; _j < _len1; v = ++_j) {
              k = assoc[v];
              _results.push(k + ',' + v);
            }
            return _results;
          })()).join('-');
          if (!(label in members)) {
            members[label] = true;
            deduped.push(sub);
          }
        }
        return deduped;
      };
      helper = function(keys) {
        var dup_l33t_index, first_key, i, l33t_chr, next_subs, rest_keys, sub, sub_alternative, sub_extension, _i, _j, _k, _len, _len1, _ref, _ref1;
        if (!keys.length) {
          return;
        }
        first_key = keys[0];
        rest_keys = keys.slice(1);
        next_subs = [];
        _ref = table[first_key];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          l33t_chr = _ref[_i];
          for (_j = 0, _len1 = subs.length; _j < _len1; _j++) {
            sub = subs[_j];
            dup_l33t_index = -1;
            for (i = _k = 0, _ref1 = sub.length; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
              if (sub[i][0] === l33t_chr) {
                dup_l33t_index = i;
                break;
              }
            }
            if (dup_l33t_index === -1) {
              sub_extension = sub.concat([[l33t_chr, first_key]]);
              next_subs.push(sub_extension);
            } else {
              sub_alternative = sub.slice(0);
              sub_alternative.splice(dup_l33t_index, 1);
              sub_alternative.push([l33t_chr, first_key]);
              next_subs.push(sub);
              next_subs.push(sub_alternative);
            }
          }
        }
        subs = dedup(next_subs);
        return helper(rest_keys);
      };
      helper(keys);
      sub_dicts = [];
      for (_i = 0, _len = subs.length; _i < _len; _i++) {
        sub = subs[_i];
        sub_dict = {};
        for (_j = 0, _len1 = sub.length; _j < _len1; _j++) {
          _ref = sub[_j], l33t_chr = _ref[0], chr = _ref[1];
          sub_dict[l33t_chr] = chr;
        }
        sub_dicts.push(sub_dict);
      }
      return sub_dicts;
    };

  l33t_table = {
      a: ['4', '@'],
      b: ['8'],
      c: ['(', '{', '[', '<'],
      e: ['3'],
      g: ['6', '9'],
      i: ['1', '!', '|'],
      l: ['1', '|', '7'],
      o: ['0'],
      s: ['$', '5'],
      t: ['+', '7'],
      x: ['%'],
      z: ['2']
    };

  relevent_l33t_subtable = function(password) {
      var chr, filtered, letter, password_chars, relevent_subs, sub, subs, _i, _len, _ref;
      password_chars = {};
      _ref = password.split('');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        chr = _ref[_i];
        password_chars[chr] = true;
      }
      filtered = {};
      for (letter in l33t_table) {
        subs = l33t_table[letter];
        relevent_subs = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = subs.length; _j < _len1; _j++) {
            sub = subs[_j];
            if (sub in password_chars) {
              _results.push(sub);
            }
          }
          return _results;
        })();
        if (relevent_subs.length > 0) {
          filtered[letter] = relevent_subs;
        }
      }
      return filtered;
    };

  l33t_match = function(password) {
      var chr, k, match, match_sub, matcher, matches, sub, subbed_chr, subbed_password, token, v, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
      matches = [];
      _ref = enumerate_l33t_subs(relevent_l33t_subtable(password));
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sub = _ref[_i];
        if (empty(sub)) {
          break;
        }
        for (_j = 0, _len1 = DICTIONARY_MATCHERS.length; _j < _len1; _j++) {
          matcher = DICTIONARY_MATCHERS[_j];
          subbed_password = translate(password, sub);
          _ref1 = matcher(subbed_password);
          for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
            match = _ref1[_k];
            token = password.slice(match.i, match.j + 1 || 9e9);
            if (token.toLowerCase() === match.matched_word) {
              continue;
            }
            match_sub = {};
            for (subbed_chr in sub) {
              chr = sub[subbed_chr];
              if (token.indexOf(subbed_chr) !== -1) {
                match_sub[subbed_chr] = chr;
              }
            }
            match.l33t = true;
            match.token = token;
            match.sub = match_sub;
            match.sub_display = ((function() {
              var _results;
              _results = [];
              for (k in match_sub) {
                v = match_sub[k];
                _results.push("" + k + " -> " + v);
              }
              return _results;
            })()).join(', ');
            matches.push(match);
          }
        }
      }
      return matches;
    };

  MATCHERS = DICTIONARY_MATCHERS.concat([l33t_match]);

  var qwerty = {"!": ["`~", null, null, "2@", "qQ", null], "\"": [";:", "[{", "]}", null, null, "/?"], "#": ["2@", null, null, "4$", "eE", "wW"], "$": ["3#", null, null, "5%", "rR", "eE"], "%": ["4$", null, null, "6^", "tT", "rR"], "&": ["6^", null, null, "8*", "uU", "yY"], "'": [";:", "[{", "]}", null, null, "/?"], "(": ["8*", null, null, "0)", "oO", "iI"], ")": ["9(", null, null, "-_", "pP", "oO"], "*": ["7&", null, null, "9(", "iI", "uU"], "+": ["-_", null, null, null, "]}", "[{"], ",": ["mM", "kK", "lL", ".>", null, null], "-": ["0)", null, null, "=+", "[{", "pP"], ".": [",<", "lL", ";:", "/?", null, null], "/": [".>", ";:", "'\"", null, null, null], "0": ["9(", null, null, "-_", "pP", "oO"], "1": ["`~", null, null, "2@", "qQ", null], "2": ["1!", null, null, "3#", "wW", "qQ"], "3": ["2@", null, null, "4$", "eE", "wW"], "4": ["3#", null, null, "5%", "rR", "eE"], "5": ["4$", null, null, "6^", "tT", "rR"], "6": ["5%", null, null, "7&", "yY", "tT"], "7": ["6^", null, null, "8*", "uU", "yY"], "8": ["7&", null, null, "9(", "iI", "uU"], "9": ["8*", null, null, "0)", "oO", "iI"], ":": ["lL", "pP", "[{", "'\"", "/?", ".>"], ";": ["lL", "pP", "[{", "'\"", "/?", ".>"], "<": ["mM", "kK", "lL", ".>", null, null], "=": ["-_", null, null, null, "]}", "[{"], ">": [",<", "lL", ";:", "/?", null, null], "?": [".>", ";:", "'\"", null, null, null], "@": ["1!", null, null, "3#", "wW", "qQ"], "A": [null, "qQ", "wW", "sS", "zZ", null], "B": ["vV", "gG", "hH", "nN", null, null], "C": ["xX", "dD", "fF", "vV", null, null], "D": ["sS", "eE", "rR", "fF", "cC", "xX"], "E": ["wW", "3#", "4$", "rR", "dD", "sS"], "F": ["dD", "rR", "tT", "gG", "vV", "cC"], "G": ["fF", "tT", "yY", "hH", "bB", "vV"], "H": ["gG", "yY", "uU", "jJ", "nN", "bB"], "I": ["uU", "8*", "9(", "oO", "kK", "jJ"], "J": ["hH", "uU", "iI", "kK", "mM", "nN"], "K": ["jJ", "iI", "oO", "lL", ",<", "mM"], "L": ["kK", "oO", "pP", ";:", ".>", ",<"], "M": ["nN", "jJ", "kK", ",<", null, null], "N": ["bB", "hH", "jJ", "mM", null, null], "O": ["iI", "9(", "0)", "pP", "lL", "kK"], "P": ["oO", "0)", "-_", "[{", ";:", "lL"], "Q": [null, "1!", "2@", "wW", "aA", null], "R": ["eE", "4$", "5%", "tT", "fF", "dD"], "S": ["aA", "wW", "eE", "dD", "xX", "zZ"], "T": ["rR", "5%", "6^", "yY", "gG", "fF"], "U": ["yY", "7&", "8*", "iI", "jJ", "hH"], "V": ["cC", "fF", "gG", "bB", null, null], "W": ["qQ", "2@", "3#", "eE", "sS", "aA"], "X": ["zZ", "sS", "dD", "cC", null, null], "Y": ["tT", "6^", "7&", "uU", "hH", "gG"], "Z": [null, "aA", "sS", "xX", null, null], "[": ["pP", "-_", "=+", "]}", "'\"", ";:"], "\\": ["]}", null, null, null, null, null], "]": ["[{", "=+", null, "\\|", null, "'\""], "^": ["5%", null, null, "7&", "yY", "tT"], "_": ["0)", null, null, "=+", "[{", "pP"], "`": [null, null, null, "1!", null, null], "a": [null, "qQ", "wW", "sS", "zZ", null], "b": ["vV", "gG", "hH", "nN", null, null], "c": ["xX", "dD", "fF", "vV", null, null], "d": ["sS", "eE", "rR", "fF", "cC", "xX"], "e": ["wW", "3#", "4$", "rR", "dD", "sS"], "f": ["dD", "rR", "tT", "gG", "vV", "cC"], "g": ["fF", "tT", "yY", "hH", "bB", "vV"], "h": ["gG", "yY", "uU", "jJ", "nN", "bB"], "i": ["uU", "8*", "9(", "oO", "kK", "jJ"], "j": ["hH", "uU", "iI", "kK", "mM", "nN"], "k": ["jJ", "iI", "oO", "lL", ",<", "mM"], "l": ["kK", "oO", "pP", ";:", ".>", ",<"], "m": ["nN", "jJ", "kK", ",<", null, null], "n": ["bB", "hH", "jJ", "mM", null, null], "o": ["iI", "9(", "0)", "pP", "lL", "kK"], "p": ["oO", "0)", "-_", "[{", ";:", "lL"], "q": [null, "1!", "2@", "wW", "aA", null], "r": ["eE", "4$", "5%", "tT", "fF", "dD"], "s": ["aA", "wW", "eE", "dD", "xX", "zZ"], "t": ["rR", "5%", "6^", "yY", "gG", "fF"], "u": ["yY", "7&", "8*", "iI", "jJ", "hH"], "v": ["cC", "fF", "gG", "bB", null, null], "w": ["qQ", "2@", "3#", "eE", "sS", "aA"], "x": ["zZ", "sS", "dD", "cC", null, null], "y": ["tT", "6^", "7&", "uU", "hH", "gG"], "z": [null, "aA", "sS", "xX", null, null], "{": ["pP", "-_", "=+", "]}", "'\"", ";:"], "|": ["]}", null, null, null, null, null], "}": ["[{", "=+", null, "\\|", null, "'\""], "~": [null, null, null, "1!", null, null]};
  GRAPHS = {
    'qwerty': qwerty
  };

  calc_average_degree = function(graph) {
    var average, k, key, n, neighbors, v;
    average = 0;
    for (key in graph) {
      neighbors = graph[key];
      average += ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = neighbors.length; _i < _len; _i++) {
          n = neighbors[_i];
          if (n) {
            _results.push(n);
          }
        }
        return _results;
      })()).length;
    }
    average /= ((function() {
      var _results;
      _results = [];
      for (k in graph) {
        v = graph[k];
        _results.push(k);
      }
      return _results;
    })()).length;
    return average;
  };

  KEYBOARD_AVERAGE_DEGREE = calc_average_degree(qwerty);

  KEYPAD_AVERAGE_DEGREE = calc_average_degree(keypad);

  KEYBOARD_STARTING_POSITIONS = ((function() {
    var _results;
    _results = [];
    for (k in qwerty) {
      v = qwerty[k];
      _results.push(k);
    }
    return _results;
  })()).length;

  var keypad = {"*": ["/", null, null, null, "-", "+", "9", "8"], "+": ["9", "*", "-", null, null, null, null, "6"], "-": ["*", null, null, null, null, null, "+", "9"], ".": ["0", "2", "3", null, null, null, null, null], "/": [null, null, null, null, "*", "9", "8", "7"], "0": [null, "1", "2", "3", ".", null, null, null], "1": [null, null, "4", "5", "2", "0", null, null], "2": ["1", "4", "5", "6", "3", ".", "0", null], "3": ["2", "5", "6", null, null, null, ".", "0"], "4": [null, null, "7", "8", "5", "2", "1", null], "5": ["4", "7", "8", "9", "6", "3", "2", "1"], "6": ["5", "8", "9", "+", null, null, "3", "2"], "7": [null, null, null, "/", "8", "5", "4", null], "8": ["7", null, "/", "*", "9", "6", "5", "4"], "9": ["8", "/", "*", "-", "+", null, "6", "5"]};

  KEYPAD_STARTING_POSITIONS = ((function() {
    var _results;
    _results = [];
    for (k in keypad) {
      v = keypad[k];
      _results.push(k);
    }
    return _results;
  })()).length;

  time = function() {
    return (new Date()).getTime();
  };

  extend = function(lst, lst2) {
      return lst.push.apply(lst, lst2);
    };
  omnimatch = function(password) {
      var matcher, matches, _i, _len;
      matches = [];
      for (_i = 0, _len = MATCHERS.length; _i < _len; _i++) {
        matcher = MATCHERS[_i];
        extend(matches, matcher(password));
      }
      return matches.sort(function(match1, match2) {
        return (match1.i - match2.i) || (match1.j - match2.j);
      });
    };
  dictionary_match = function(password, ranked_dict) {
      var i, j, len, password_lower, rank, result, word, _i, _j;
      result = [];
      len = password.length;
      password_lower = password.toLowerCase();
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        for (j = _j = i; i <= len ? _j < len : _j > len; j = i <= len ? ++_j : --_j) {
          if (password_lower.slice(i, j + 1 || 9e9) in ranked_dict) {
            word = password_lower.slice(i, j + 1 || 9e9);
            rank = ranked_dict[word];
            result.push({
              pattern: 'dictionary',
              i: i,
              j: j,
              token: password.slice(i, j + 1 || 9e9),
              matched_word: word,
              rank: rank
            });
          }
        }
      }
      return result;
    };
  zxcvbn = function(password, user_inputs) {
    var i, matches, result, start, _i, _ref;
    start = time();
    if (user_inputs != null) {
      for (i = _i = 0, _ref = user_inputs.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        ranked_user_inputs_dict[user_inputs[i]] = i + 1;
      }
    }
    matches = omnimatch(password);
    result = minimum_entropy_match_sequence(password, matches);
    result.calc_time = time() - start;
    return result;
  };
