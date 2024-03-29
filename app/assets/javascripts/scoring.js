  var ALL_LOWER, ALL_UPPER, END_UPPER, NUM_ATTACKERS, NUM_DAYS, NUM_MONTHS, NUM_YEARS, SECONDS_PER_GUESS, SINGLE_GUESS, START_UPPER, calc_bruteforce_cardinality, calc_entropy, crack_time_to_score, date_entropy, dictionary_entropy, digits_entropy, display_time, entropy_to_crack_time, extra_l33t_entropy, extra_uppercase_entropy, lg, minimum_entropy_match_sequence, nCk, repeat_entropy, round_to_x_digits, sequence_entropy, spatial_entropy, year_entropy;

  nCk = function(n, k) {
    var d, r, _i;
    if (k > n) {
      return 0;
    }
    if (k === 0) {
      return 1;
    }
    r = 1;
    for (d = _i = 1; 1 <= k ? _i <= k : _i >= k; d = 1 <= k ? ++_i : --_i) {
      r *= n;
      r /= d;
      n -= 1;
    }
    return r;
  };

  lg = function(n) {
    return Math.log(n) / Math.log(2);
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

  round_to_x_digits = function(n, x) {
    return Math.round(n * Math.pow(10, x)) / Math.pow(10, x);
  };

  SINGLE_GUESS = .010;

  NUM_ATTACKERS = 100;

  SECONDS_PER_GUESS = SINGLE_GUESS / NUM_ATTACKERS;

  entropy_to_crack_time = function(entropy) {
    return .5 * Math.pow(2, entropy) * SECONDS_PER_GUESS;
  };

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

  calc_entropy = function(match) {
    var entropy_func;
    if (match.entropy != null) {
      return match.entropy;
    }
    entropy_func = (function() {
      switch (match.pattern) {
        case 'repeat':
          return repeat_entropy;
        case 'sequence':
          return sequence_entropy;
        case 'digits':
          return digits_entropy;
        case 'year':
          return year_entropy;
        case 'date':
          return date_entropy;
        case 'spatial':
          return spatial_entropy;
        case 'dictionary':
          return dictionary_entropy;
      }
    })();
    return match.entropy = entropy_func(match);
  };

  repeat_entropy = function(match) {
    var cardinality;
    cardinality = calc_bruteforce_cardinality(match.token);
    return lg(cardinality * match.token.length);
  };

  sequence_entropy = function(match) {
    var base_entropy, first_chr;
    first_chr = match.token.charAt(0);
    if (first_chr === 'a' || first_chr === '1') {
      base_entropy = 1;
    } else {
      if (first_chr.match(/\d/)) {
        base_entropy = lg(10);
      } else if (first_chr.match(/[a-z]/)) {
        base_entropy = lg(26);
      } else {
        base_entropy = lg(26) + 1;
      }
    }
    if (!match.ascending) {
      base_entropy += 1;
    }
    return base_entropy + lg(match.token.length);
  };

  digits_entropy = function(match) {
    return lg(Math.pow(10, match.token.length));
  };

  NUM_YEARS = 119;

  NUM_MONTHS = 12;

  NUM_DAYS = 31;

  year_entropy = function(match) {
    return lg(NUM_YEARS);
  };

  date_entropy = function(match) {
    var entropy;
    if (match.year < 100) {
      entropy = lg(NUM_DAYS * NUM_MONTHS * 100);
    } else {
      entropy = lg(NUM_DAYS * NUM_MONTHS * NUM_YEARS);
    }
    if (match.separator) {
      entropy += 2;
    }
    return entropy;
  };

  spatial_entropy = function(match) {
    var L, S, U, d, entropy, i, j, possibilities, possible_turns, s, t, _i, _j, _k, _ref, _ref1;
    if ((_ref = match.graph) === 'qwerty' || _ref === 'dvorak') {
      s = KEYBOARD_STARTING_POSITIONS;
      d = KEYBOARD_AVERAGE_DEGREE;
    } else {
      s = KEYPAD_STARTING_POSITIONS;
      d = KEYPAD_AVERAGE_DEGREE;
    }
    possibilities = 0;
    L = match.token.length;
    t = match.turns;
    for (i = _i = 2; 2 <= L ? _i <= L : _i >= L; i = 2 <= L ? ++_i : --_i) {
      possible_turns = Math.min(t, i - 1);
      for (j = _j = 1; 1 <= possible_turns ? _j <= possible_turns : _j >= possible_turns; j = 1 <= possible_turns ? ++_j : --_j) {
        possibilities += nCk(i - 1, j - 1) * s * Math.pow(d, j);
      }
    }
    entropy = lg(possibilities);
    if (match.shifted_count) {
      S = match.shifted_count;
      U = match.token.length - match.shifted_count;
      possibilities = 0;
      for (i = _k = 0, _ref1 = Math.min(S, U); 0 <= _ref1 ? _k <= _ref1 : _k >= _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
        possibilities += nCk(S + U, i);
      }
      entropy += lg(possibilities);
    }
    return entropy;
  };

  dictionary_entropy = function(match) {
    match.base_entropy = lg(match.rank);
    match.uppercase_entropy = extra_uppercase_entropy(match);
    match.l33t_entropy = extra_l33t_entropy(match);
    return match.base_entropy + match.uppercase_entropy + match.l33t_entropy;
  };

  START_UPPER = /^[A-Z][^A-Z]+$/;

  END_UPPER = /^[^A-Z]+[A-Z]$/;

  ALL_UPPER = /^[^a-z]+$/;

  ALL_LOWER = /^[^A-Z]+$/;

  extra_uppercase_entropy = function(match) {
    var L, U, chr, i, possibilities, regex, word, _i, _j, _len, _ref, _ref1;
    word = match.token;
    if (word.match(ALL_LOWER)) {
      return 0;
    }
    _ref = [START_UPPER, END_UPPER, ALL_UPPER];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      regex = _ref[_i];
      if (word.match(regex)) {
        return 1;
      }
    }
    U = ((function() {
      var _j, _len1, _ref1, _results;
      _ref1 = word.split('');
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        chr = _ref1[_j];
        if (chr.match(/[A-Z]/)) {
          _results.push(chr);
        }
      }
      return _results;
    })()).length;
    L = ((function() {
      var _j, _len1, _ref1, _results;
      _ref1 = word.split('');
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        chr = _ref1[_j];
        if (chr.match(/[a-z]/)) {
          _results.push(chr);
        }
      }
      return _results;
    })()).length;
    possibilities = 0;
    for (i = _j = 0, _ref1 = Math.min(U, L); 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      possibilities += nCk(U + L, i);
    }
    return lg(possibilities);
  };

  extra_l33t_entropy = function(match) {
    var S, U, chr, i, possibilities, subbed, unsubbed, _i, _ref, _ref1;
    if (!match.l33t) {
      return 0;
    }
    possibilities = 0;
    _ref = match.sub;
    for (subbed in _ref) {
      unsubbed = _ref[subbed];
      S = ((function() {
        var _i, _len, _ref1, _results;
        _ref1 = match.token.split('');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          chr = _ref1[_i];
          if (chr === subbed) {
            _results.push(chr);
          }
        }
        return _results;
      })()).length;
      U = ((function() {
        var _i, _len, _ref1, _results;
        _ref1 = match.token.split('');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          chr = _ref1[_i];
          if (chr === unsubbed) {
            _results.push(chr);
          }
        }
        return _results;
      })()).length;
      for (i = _i = 0, _ref1 = Math.min(U, S); 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        possibilities += nCk(U + S, i);
      }
    }
    return lg(possibilities) || 1;
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

