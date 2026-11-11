/* ══════════════════════════════════════════════════════════════════
   ENGINEERING WORKBOOK · ISO 286-1:2010 LIMITS AND FITS
   Single source of truth for every calculator in the workbook
   (hole-fit calculator, interference fit, Lee plug ream sizes).

   Sizes in mm, deviations in µm. Nominal sizes 0 < d ≤ 500 mm.
   Size steps are "over X up to and including Y".

   WBISO.it(d, grade)                → IT value (µm) or null
   WBISO.shaft(d, letter, grade)     → {ei, es, it, min, max}  or {error}
   WBISO.hole(d, letter, grade)      → {EI, ES, it, min, max}  or {error}
   WBISO.limits(d, 'H7' | 'p6')      → as above, class parsed from the string
   ══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';

  // ── Standard tolerance grades IT1…IT18 (µm) ─────────────────────
  var IT_STEPS = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];
  var IT = {
    1:  [0.8, 1, 1, 1.2, 1.5, 1.5, 2, 2.5, 3.5, 4.5, 6, 7, 8],
    2:  [1.2, 1.5, 1.5, 2, 2.5, 2.5, 3, 4, 5, 7, 8, 9, 10],
    3:  [2, 2.5, 2.5, 3, 4, 4, 5, 6, 8, 10, 12, 13, 15],
    4:  [3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20],
    5:  [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
    6:  [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
    7:  [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
    8:  [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
    9:  [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
    10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
    11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
    12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
    13: [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890, 970],
    14: [250, 300, 360, 430, 520, 620, 740, 870, 1000, 1150, 1300, 1400, 1550],
    15: [400, 480, 580, 700, 840, 1000, 1200, 1400, 1600, 1850, 2100, 2300, 2500],
    16: [600, 750, 900, 1100, 1300, 1600, 1900, 2200, 2500, 2900, 3200, 3600, 4000],
    17: [1000, 1200, 1500, 1800, 2100, 2500, 3000, 3500, 4000, 4600, 5200, 5700, 6300],
    18: [1400, 1800, 2200, 2700, 3300, 3900, 4600, 5400, 6300, 7200, 8100, 8900, 9700]
  };

  // ── Fundamental deviations (µm) ─────────────────────────────────
  // 25 size steps:        ≤3    6    10    14    18    24    30    40    50    65    80   100   120   140   160   180   200   225   250   280   315   355   400   450   500
  var DEV_STEPS = [3, 6, 10, 14, 18, 24, 30, 40, 50, 65, 80, 100, 120, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500];
  var N_ = null; // not defined for this size step

  // Shafts a…h: fundamental deviation is the UPPER deviation es (≤ 0)
  var SHAFT_ES = {
    a:  [-270, -270, -280, -290, -290, -300, -300, -310, -320, -340, -360, -380, -410, -460, -520, -580, -660, -740, -820, -920, -1050, -1200, -1350, -1500, -1650],
    b:  [-140, -140, -150, -150, -150, -160, -160, -170, -180, -190, -200, -220, -240, -260, -280, -310, -340, -380, -420, -480, -540, -600, -680, -760, -840],
    c:  [-60, -70, -80, -95, -95, -110, -110, -120, -130, -140, -150, -170, -180, -200, -210, -230, -240, -260, -280, -300, -330, -360, -400, -440, -480],
    // cd, ef, fg (fine mechanisms / horology) are only tabulated here up to 10 mm
    cd: [-34, -46, -56, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_],
    d:  [-20, -30, -40, -50, -50, -65, -65, -80, -80, -100, -100, -120, -120, -145, -145, -145, -170, -170, -170, -190, -190, -210, -210, -230, -230],
    e:  [-14, -20, -25, -32, -32, -40, -40, -50, -50, -60, -60, -72, -72, -85, -85, -85, -100, -100, -100, -110, -110, -125, -125, -135, -135],
    ef: [-10, -14, -18, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_],
    f:  [-6, -10, -13, -16, -16, -20, -20, -25, -25, -30, -30, -36, -36, -43, -43, -43, -50, -50, -50, -56, -56, -62, -62, -68, -68],
    fg: [-4, -6, -8, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_, N_],
    g:  [-2, -4, -5, -6, -6, -7, -7, -9, -9, -10, -10, -12, -12, -14, -14, -14, -15, -15, -15, -17, -17, -18, -18, -20, -20],
    h:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  // Shafts k…zc: fundamental deviation is the LOWER deviation ei (≥ 0)
  // k applies to grades IT4–IT7 only (ei = 0 for all other grades)
  var SHAFT_EI = {
    k:  [0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5],
    m:  [2, 4, 6, 7, 7, 8, 8, 9, 9, 11, 11, 13, 13, 15, 15, 15, 17, 17, 17, 20, 20, 21, 21, 23, 23],
    n:  [4, 8, 10, 12, 12, 15, 15, 17, 17, 20, 20, 23, 23, 27, 27, 27, 31, 31, 31, 34, 34, 37, 37, 40, 40],
    p:  [6, 12, 15, 18, 18, 22, 22, 26, 26, 32, 32, 37, 37, 43, 43, 43, 50, 50, 50, 56, 56, 62, 62, 68, 68],
    r:  [10, 15, 19, 23, 23, 28, 28, 34, 34, 41, 43, 51, 54, 63, 65, 68, 77, 80, 84, 94, 98, 108, 114, 126, 132],
    s:  [14, 19, 23, 28, 28, 35, 35, 43, 43, 53, 59, 71, 79, 92, 100, 108, 122, 130, 140, 158, 170, 190, 208, 232, 252],
    t:  [N_, N_, N_, N_, N_, N_, 41, 48, 54, 66, 75, 91, 104, 122, 134, 146, 166, 180, 196, 218, 240, 268, 294, 330, 360],
    u:  [18, 23, 28, 33, 33, 41, 48, 60, 70, 87, 102, 124, 144, 170, 190, 210, 236, 258, 284, 315, 350, 390, 435, 490, 540],
    v:  [N_, N_, N_, N_, 39, 47, 55, 68, 81, 102, 120, 146, 172, 202, 228, 252, 284, 310, 340, 385, 425, 475, 530, 595, 660],
    x:  [20, 28, 34, 40, 45, 54, 64, 80, 97, 122, 146, 178, 210, 248, 280, 310, 350, 385, 425, 475, 525, 590, 660, 740, 820],
    y:  [N_, N_, N_, N_, N_, 63, 75, 94, 114, 144, 174, 214, 254, 300, 340, 380, 425, 470, 520, 580, 650, 730, 820, 920, 1000],
    z:  [26, 35, 42, 50, 60, 73, 88, 112, 136, 172, 210, 258, 310, 365, 415, 465, 520, 575, 640, 710, 790, 900, 1000, 1100, 1250],
    za: [32, 42, 52, 64, 77, 98, 118, 148, 180, 226, 274, 335, 400, 470, 535, 600, 670, 740, 820, 920, 1000, 1150, 1300, 1450, 1600],
    zb: [40, 50, 67, 90, 108, 136, 160, 200, 242, 300, 360, 445, 525, 620, 700, 780, 880, 960, 1050, 1200, 1300, 1500, 1650, 1850, 2100],
    zc: [60, 80, 97, 130, 150, 188, 218, 274, 325, 405, 480, 585, 690, 800, 900, 1000, 1150, 1250, 1350, 1550, 1700, 1900, 2100, 2400, 2600]
  };

  var SHAFT_LETTERS = ['a', 'b', 'c', 'cd', 'd', 'e', 'ef', 'f', 'fg', 'g', 'h', 'js', 'k', 'm', 'n', 'p', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z', 'za', 'zb', 'zc'];
  var HOLE_LETTERS = SHAFT_LETTERS.map(function (l) { return l.toUpperCase(); });
  var GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  function stepIndex(steps, d) {
    for (var i = 0; i < steps.length; i++) if (d <= steps[i]) return i;
    return -1;
  }
  function sizeOK(d) { return typeof d === 'number' && isFinite(d) && d > 0 && d <= 500; }
  function err(msg) { return { error: msg }; }

  function it(d, grade) {
    if (!sizeOK(d)) return null;
    var row = IT[grade]; if (!row) return null;
    var i = stepIndex(IT_STEPS, d);
    return i < 0 ? null : row[i];
  }

  // Lowest size for which a letter is defined (exclusive lower bound, mm)
  var LETTER_NOTE = {
    a: 'a / A is not used for sizes up to 1 mm', b: 'b / B is not used for sizes up to 1 mm',
    cd: 'cd / CD is only tabulated up to 10 mm', ef: 'ef / EF is only tabulated up to 10 mm', fg: 'fg / FG is only tabulated up to 10 mm',
    t: 't / T is only defined above 24 mm', v: 'v / V is only defined above 14 mm', y: 'y / Y is only defined above 18 mm'
  };

  // Raw fundamental deviation of a SHAFT letter at size d (µm, signed); null if undefined
  function shaftFD(d, l) {
    var i = stepIndex(DEV_STEPS, d); if (i < 0) return null;
    if ((l === 'a' || l === 'b') && d <= 1) return null;
    if (SHAFT_ES[l]) return SHAFT_ES[l][i];
    if (SHAFT_EI[l]) return SHAFT_EI[l][i];
    return null;
  }

  function pack(lo, hi, tol, d, upper) {
    var o = { it: tol, min: d + lo / 1000, max: d + hi / 1000 };
    if (upper) { o.EI = lo; o.ES = hi; } else { o.ei = lo; o.es = hi; }
    return o;
  }

  function shaft(d, letter, grade) {
    if (!sizeOK(d)) return err('Nominal size must be over 0 and up to 500 mm');
    var l = String(letter || '').toLowerCase(); grade = +grade;
    var T = it(d, grade); if (T == null) return err('Tolerance grade IT' + grade + ' is not available');
    if (l === 'js') return pack(-T / 2, T / 2, T, d, false);
    if (l === 'j') return err('j is grade-specific and not symmetric — not supported (use js)');
    if (!SHAFT_ES[l] && !SHAFT_EI[l]) return err('Unknown shaft deviation "' + letter + '"');
    var fd = shaftFD(d, l);
    if (fd == null) return err((LETTER_NOTE[l] || (l + ' is not defined for this size')));
    if (SHAFT_ES[l]) return pack(fd - T, fd, T, d, false);         // a…h: es is fundamental
    if (l === 'k' && (grade < 4 || grade > 7)) fd = 0;             // k: only IT4–IT7 carry a deviation
    return pack(fd, fd + T, T, d, false);                          // k…zc: ei is fundamental
  }

  function hole(d, letter, grade) {
    if (!sizeOK(d)) return err('Nominal size must be over 0 and up to 500 mm');
    var L = String(letter || '').toUpperCase(), l = L.toLowerCase(); grade = +grade;
    var T = it(d, grade); if (T == null) return err('Tolerance grade IT' + grade + ' is not available');
    if (L === 'JS') return pack(-T / 2, T / 2, T, d, true);
    if (L === 'J') return err('J is grade-specific and not symmetric — not supported (use JS)');
    if (!SHAFT_ES[l] && !SHAFT_EI[l]) return err('Unknown hole deviation "' + letter + '"');
    var fd = shaftFD(d, l);
    if (fd == null) return err((LETTER_NOTE[l] || (L + ' is not defined for this size')));

    // A…H: EI = −es of the same-letter shaft
    if (SHAFT_ES[l]) return pack(-fd, -fd + T, T, d, true);

    // K…ZC: ES = −ei (+Δ for the finer grades, sizes over 3 mm), Δ = ITn − IT(n−1)
    var isKMN = (l === 'k' || l === 'm' || l === 'n');
    var deltaGrades = isKMN ? grade <= 8 : grade <= 7;
    var ES;
    if (deltaGrades) {
      if (grade < 3) return err(L + grade + ' is not defined (Δ is only tabulated for IT3 and coarser)');
      var delta = d > 3 ? T - it(d, grade - 1) : 0;
      ES = -fd + delta;
      if (l === 'm' && grade === 6 && d > 250 && d <= 315) ES = -9;   // ISO 286-1 special case M6
    } else if (l === 'k') {
      ES = 0;                                                          // K above IT8
    } else if (l === 'n') {
      ES = d > 3 ? 0 : -4;                                             // N above IT8
    } else {
      ES = -fd;                                                        // M above IT8, P…ZC above IT7
    }
    return pack(ES - T, ES, T, d, true);
  }

  // 'H7', 'p6', 'JS9', 'za8' → {letter, grade, isHole}
  function parseClass(cls) {
    var m = String(cls || '').trim().match(/^([A-Za-z]{1,2})\s*(\d{1,2})$/);
    if (!m) return null;
    return { letter: m[1], grade: +m[2], isHole: m[1] === m[1].toUpperCase() };
  }
  function limits(d, cls) {
    var c = parseClass(cls); if (!c) return err('Unrecognised tolerance class "' + cls + '"');
    return c.isHole ? hole(d, c.letter, c.grade) : shaft(d, c.letter, c.grade);
  }

  g.WBISO = {
    it: it, shaft: shaft, hole: hole, limits: limits, parseClass: parseClass,
    SHAFT_LETTERS: SHAFT_LETTERS, HOLE_LETTERS: HOLE_LETTERS, GRADES: GRADES,
    _tables: { IT: IT, IT_STEPS: IT_STEPS, DEV_STEPS: DEV_STEPS, SHAFT_ES: SHAFT_ES, SHAFT_EI: SHAFT_EI }
  };
})(typeof window !== 'undefined' ? window : globalThis);
