import { expect, test } from "vitest";
import {
  expandPaste,
  parseClipboard,
  parseHtmlTable,
  parseTsv,
  serializeHtmlTable,
  serializeTsv,
  type GridClipboardCell,
} from "./grid-clipboard";

/**
 * The G3 clipboard fixtures (Regent Tables, 23-10-2026): what Google Sheets wrote, recorded live,
 * and the documented shapes of Excel (Windows and macOS), Numbers and Airtable. `expected` is the
 * matrix of displayed strings a paste must produce.
 */
interface Fixture {
  id: string;
  recorded: "live" | "documented";
  text: string | null;
  html: string | null;
  sheets: string | null;
  expected: string[][];
}

const FIXTURES: Fixture[] = [
  {
    id: "google-sheets.live.text-header-6x4",
    recorded: "live",
    text: "Student Name\tGender\tClass Level\tHome State\tMajor\tExtracurricular Activity\nAlexandra\tFemale\t4. Senior\tCA\tEnglish\tDrama Club\nAndrew\tMale\t1. Freshman\tSD\tMath\tLacrosse\nAnna\tFemale\t1. Freshman\tNC\tEnglish\tBasketball",
    html: '<google-sheets-html-origin><style type="text/css"><!--td {border: 1px solid #cccccc;}br {mso-data-placement:same-cell;}--></style><table xmlns="http://www.w3.org/1999/xhtml" cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed;font-size:10pt;font-family:arial,sans,sans-serif;width:0px;border-collapse:collapse;border:none" data-sheets-root="1" data-sheets-baot="1"><colgroup><col width="120"/><col width="120"/><col width="120"/><col width="120"/><col width="120"/><col width="120"/></colgroup><tbody><tr style="height:21px;"><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:middle;font-weight:bold;">Student Name</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:middle;font-weight:bold;">Gender</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:middle;font-weight:bold;">Class Level</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:middle;font-weight:bold;">Home State</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:middle;font-weight:bold;">Major</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:middle;font-weight:bold;">Extracurricular Activity</td></tr><tr style="height:21px;"><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Alexandra</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Female</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">4. Senior</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">CA</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">English</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Drama Club</td></tr><tr style="height:21px;"><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Andrew</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Male</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">1. Freshman</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">SD</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Math</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Lacrosse</td></tr><tr style="height:21px;"><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Anna</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Female</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">1. Freshman</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">NC</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">English</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;">Basketball</td></tr></tbody></table>',
    sheets:
      '{"1":1,"2":[-24,195],"3":{"1":[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],"4":["Student Name","Gender","Class Level","Home State","Major","Extracurricular Activity","Alexandra","Female","4. Senior","CA","English","Drama Club","Andrew","Male","1. Freshman","SD","Math","Lacrosse","Anna","Female","1. Freshman","NC","English","Basketball"]},"4":[{"2":20480,"15":"arial,sans,sans-serif","17":1},{"2":4224,"10":2,"15":"arial,sans,sans-serif"}],"5":[-6,0,-18,1],"12":[-24,1],"13":[-24,1],"15":{"1":4,"2":6},"20":24}',
    expected: [
      [
        "Student Name",
        "Gender",
        "Class Level",
        "Home State",
        "Major",
        "Extracurricular Activity",
      ],
      ["Alexandra", "Female", "4. Senior", "CA", "English", "Drama Club"],
      ["Andrew", "Male", "1. Freshman", "SD", "Math", "Lacrosse"],
      ["Anna", "Female", "1. Freshman", "NC", "English", "Basketball"],
    ],
  },
  {
    id: "google-sheets.live.numbers-empties-5x4",
    recorded: "live",
    text: "\tMinimize:\tObjective Coefficient\t1\t1\nObjective Value\t0.1086622782\tSolution Value\t0.02951906168\t0\nConstraint Name\tConstraint Lower Bound\t\t\t\ncalories\t3\t≤\t44.7\t11.6",
    html: '<google-sheets-html-origin><style type="text/css"><!--td {border: 1px solid #cccccc;overflow: hidden;padding: 2px 3px 2px 3px;vertical-align: bottom;}br {mso-data-placement:same-cell;}--></style><table xmlns="http://www.w3.org/1999/xhtml" cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed;font-size:10pt;font-family:arial,sans,sans-serif;width:0px;border-collapse:collapse;border:none" data-sheets-root="1" data-sheets-baot="1"><colgroup><col width="180"/><col width="180"/><col width="180"/><col width="151"/><col width="100"/></colgroup><tbody><tr><td></td><td>Minimize:</td><td style="background-color:#c9daf8;font-weight:bold;">Objective Coefficient</td><td style="background-color:#c9daf8;text-align:right;">1</td><td style="background-color:#c9daf8;text-align:right;">1</td></tr><tr><td style="font-weight:bold;">Objective Value</td><td style="color:#808080;text-align:right;">0.1086622782</td><td style="background-color:#c9daf8;font-weight:bold;">Solution Value</td><td style="background-color:#c9daf8;color:#808080;text-align:right;">0.02951906168</td><td style="background-color:#c9daf8;color:#808080;text-align:right;">0</td></tr><tr><td style="background-color:#fff2cc;font-weight:bold;">Constraint Name</td><td style="background-color:#fff2cc;font-weight:bold;">Constraint Lower Bound</td><td style="background-color:#fff2cc;"></td><td style="background-color:#fff2cc;"></td><td style="background-color:#fff2cc;"></td></tr><tr><td style="background-color:#fff2cc;">calories</td><td style="background-color:#fff2cc;text-align:right;">3</td><td style="background-color:#fff2cc;">≤</td><td style="background-color:#fff2cc;text-align:right;">44.7</td><td style="background-color:#fff2cc;text-align:right;">11.6</td></tr></tbody></table>',
    sheets:
      '{"1":1,"2":[194,-11,195,-3,194,-5,195],"3":{"1":[2,2,1,1,2,1,2,1,1,2,2,2,1,2,1,1],"3":[1,1,0.10866227820675683,0.029519061676488278,0,3,44.7,11.6],"4":["Minimize:","Objective Coefficient","Objective Value","Solution Value","Constraint Name","Constraint Lower Bound","calories","≤"]},"4":[{"2":4224,"10":2,"15":"arial,sans,sans-serif"},{"2":20610,"4":{"1":2,"2":13228792},"10":2,"15":"arial,sans,sans-serif","17":1},{"2":4290,"4":{"1":2,"2":13228792},"9":2,"10":2,"15":"arial,sans,sans-serif"},{"2":20608,"10":2,"15":"arial,sans,sans-serif","17":1},{"2":6336,"9":2,"10":2,"14":{"1":2,"2":8421504},"15":"arial,sans,sans-serif"},{"2":6338,"4":{"1":2,"2":13228792},"9":2,"10":2,"14":{"1":2,"2":8421504},"15":"arial,sans,sans-serif"},{"2":20610,"4":{"1":2,"2":16773836},"10":2,"15":"arial,sans,sans-serif","17":1},{"2":4226,"4":{"1":2,"2":16773836},"10":2,"15":"arial,sans,sans-serif"},{"2":4290,"4":{"1":2,"2":16773836},"9":2,"10":2,"15":"arial,sans,sans-serif"}],"5":[-2,0,1,-2,2,3,4,1,-2,5,-2,6,-4,7,8,7,-2,8],"12":[-20,1],"13":[-20,1],"15":{"1":4,"2":5},"20":20}',
    expected: [
      ["", "Minimize:", "Objective Coefficient", "1", "1"],
      [
        "Objective Value",
        "0.1086622782",
        "Solution Value",
        "0.02951906168",
        "0",
      ],
      ["Constraint Name", "Constraint Lower Bound", "", "", ""],
      ["calories", "3", "≤", "44.7", "11.6"],
    ],
  },
  {
    id: "google-sheets.live.dates-numbers-trailing-empties-6x5",
    recorded: "live",
    text: "Month\tStockholm\tBerlin\tLos Angeles\t\t\n2019-01-11\t-1\t2.9\t13\t\t\n2019-02-15\t-1\t4.2\t13\t\t\n2019-03-15\t3\t8.5\t14\t\t\n2019-04-15\t9\t13.2\t16\t\t",
    html: '<google-sheets-html-origin><style type="text/css"><!--td {border: 1px solid #cccccc;overflow: hidden;padding: 2px 3px 2px 3px;vertical-align: bottom;}br {mso-data-placement:same-cell;}--></style><table xmlns="http://www.w3.org/1999/xhtml" cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed;font-size:10pt;font-family:Arial;width:0px;border-collapse:collapse;border:none" data-sheets-root="1" data-sheets-baot="1"><colgroup><col width="100"/><col width="100"/><col width="100"/><col width="100"/><col width="100"/><col width="100"/></colgroup><tbody><tr><td style="font-weight:bold;">Month</td><td style="font-weight:bold;">Stockholm</td><td style="font-weight:bold;">Berlin</td><td style="font-weight:bold;">Los Angeles</td><td></td><td></td></tr><tr><td style="text-align:right;">2019-01-11</td><td style="vertical-align:top;background-color:#f9f9f9;font-size:11pt;color:#333333;text-align:right;">-1</td><td style="vertical-align:top;background-color:#f9f9f9;font-size:11pt;color:#333333;text-align:right;">2.9</td><td style="vertical-align:top;background-color:#f9f9f9;font-size:11pt;color:#333333;text-align:right;">13</td><td style="vertical-align:top;background-color:#f9f9f9;"></td><td style="vertical-align:top;background-color:#f9f9f9;"></td></tr><tr><td style="text-align:right;">2019-02-15</td><td style="text-align:right;">-1</td><td style="text-align:right;">4.2</td><td style="text-align:right;">13</td><td></td><td></td></tr><tr><td style="text-align:right;">2019-03-15</td><td style="text-align:right;">3</td><td style="text-align:right;">8.5</td><td style="text-align:right;">14</td><td></td><td></td></tr><tr><td style="text-align:right;">2019-04-15</td><td style="text-align:right;">9</td><td style="text-align:right;">13.2</td><td style="text-align:right;">16</td><td></td><td></td></tr></tbody></table>',
    sheets:
      '{"1":1,"2":[-4,195,-2,194,-4,195,-2,194,-4,195,-2,194,-4,195,-2,194,-4,195,-2,194],"3":{"1":[2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"3":[43476,-1,2.9,13,43511,-1,4.2,13,43539,3,8.5,14,43570,9,13.2,16],"4":["Month","Stockholm","Berlin","Los Angeles"]},"4":[{"2":20608,"10":2,"15":"Arial","17":1},{"2":4224,"10":2,"15":"Arial"},{"2":4289,"3":{"1":5,"2":"yyyy-mm-dd","3":1},"9":2,"10":2,"15":"Arial"},{"2":14530,"4":{"1":2,"2":16382457},"9":2,"10":0,"14":{"1":2,"2":3355443},"15":"Arial","16":11},{"2":4226,"4":{"1":2,"2":16382457},"10":0,"15":"Arial"},{"2":4288,"9":2,"10":2,"15":"Arial"}],"5":[-4,0,-2,1,2,-3,3,-2,4,2,-3,5,-2,1,2,-3,5,-2,1,2,-3,5,-2,1],"12":[-30,1],"13":[-30,1],"15":{"1":5,"2":6},"20":30}',
    expected: [
      ["Month", "Stockholm", "Berlin", "Los Angeles", "", ""],
      ["2019-01-11", "-1", "2.9", "13", "", ""],
      ["2019-02-15", "-1", "4.2", "13", "", ""],
      ["2019-03-15", "3", "8.5", "14", "", ""],
      ["2019-04-15", "9", "13.2", "16", "", ""],
    ],
  },
  {
    id: "excel-windows.documented.mixed-6x5",
    recorded: "documented",
    text: 'Name\tDate\tAmount\tNotes\tEmpty\tFlag\nARC-120 sample\t23/10/2026\t1,234,567.89\t"line one\nline two"\t\tTRUE\n"Quote ""A"""\t01/01/2026\t-42.50\tsingle\t\tFALSE\nPercent\t\t12.5%\t\t\t\nCurrency\t\t$9,876.50\t\t\t\n',
    html: '<html xmlns:v="urn:schemas-microsoft-com:vml"\nxmlns:o="urn:schemas-microsoft-com:office:office"\nxmlns:x="urn:schemas-microsoft-com:office:excel"\nxmlns="http://www.w3.org/TR/REC-html40">\n\n<head>\n<meta http-equiv=Content-Type content="text/html; charset=utf-8">\n<meta name=ProgId content=Excel.Sheet>\n<meta name=Generator content="Microsoft Excel 15">\n<style>\n<!--table\n\t{mso-displayed-decimal-separator:"\\.";\n\tmso-displayed-thousand-separator:"\\,";}\n.xl65\n\t{mso-style-parent:style0;\n\twhite-space:normal;}\nbr\n\t{mso-data-placement:same-cell;}\n-->\n</style>\n</head>\n\n<body link="#0563C1" vlink="#954F72">\n\n<table border=0 cellpadding=0 cellspacing=0 width=520 style=\'border-collapse:\n collapse;width:390pt\'>\n<!--StartFragment-->\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>Name</td>\n  <td class=xl65>Date</td>\n  <td class=xl65 align=right x:num="Amount">Amount</td>\n  <td class=xl65>Notes</td>\n  <td class=xl65>Empty</td>\n  <td class=xl65>Flag</td>\n </tr>\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>ARC-120 sample</td>\n  <td class=xl65>23/10/2026</td>\n  <td class=xl65 align=right x:num="1234567.89">1,234,567.89</td>\n  <td class=xl65>line one<br>line two</td>\n  <td></td>\n  <td class=xl65>TRUE</td>\n </tr>\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>Quote &quot;A&quot;</td>\n  <td class=xl65>01/01/2026</td>\n  <td class=xl65 align=right x:num="-42.50">-42.50</td>\n  <td class=xl65>single</td>\n  <td></td>\n  <td class=xl65>FALSE</td>\n </tr>\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>Percent</td>\n  <td></td>\n  <td class=xl65 align=right x:num="12.5">12.5%</td>\n  <td></td>\n  <td></td>\n  <td></td>\n </tr>\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>Currency</td>\n  <td></td>\n  <td class=xl65 align=right x:num="9876.50">$9,876.50</td>\n  <td></td>\n  <td></td>\n  <td></td>\n </tr>\n<!--EndFragment-->\n</table>\n\n</body>\n\n</html>\n',
    sheets: null,
    expected: [
      ["Name", "Date", "Amount", "Notes", "Empty", "Flag"],
      [
        "ARC-120 sample",
        "23/10/2026",
        "1,234,567.89",
        "line one\nline two",
        "",
        "TRUE",
      ],
      ['Quote "A"', "01/01/2026", "-42.50", "single", "", "FALSE"],
      ["Percent", "", "12.5%", "", "", ""],
      ["Currency", "", "$9,876.50", "", "", ""],
    ],
  },
  {
    id: "excel-mac.documented.mixed-6x5",
    recorded: "documented",
    text: 'Name\tDate\tAmount\tNotes\tEmpty\tFlag\nARC-120 sample\t23/10/2026\t1,234,567.89\t"line one\nline two"\t\tTRUE\n"Quote ""A"""\t01/01/2026\t-42.50\tsingle\t\tFALSE\nPercent\t\t12.5%\t\t\t\nCurrency\t\t$9,876.50\t\t\t\n',
    html: '<html xmlns:v="urn:schemas-microsoft-com:vml"\nxmlns:o="urn:schemas-microsoft-com:office:office"\nxmlns:x="urn:schemas-microsoft-com:office:excel"\nxmlns="http://www.w3.org/TR/REC-html40">\n\n<head>\n<meta http-equiv=Content-Type content="text/html; charset=utf-8">\n<meta name=ProgId content=Excel.Sheet>\n<meta name=Generator content="Microsoft Excel 15">\n<style>\n<!--table\n\t{mso-displayed-decimal-separator:"\\.";\n\tmso-displayed-thousand-separator:"\\,";}\n.xl65\n\t{mso-style-parent:style0;\n\twhite-space:normal;}\nbr\n\t{mso-data-placement:same-cell;}\n-->\n</style>\n</head>\n\n<body link="#0563C1" vlink="#954F72">\n\n<table border=0 cellpadding=0 cellspacing=0 width=520 style=\'border-collapse:\n collapse;width:390pt\'>\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>Name</td>\n  <td class=xl65>Date</td>\n  <td class=xl65 align=right x:num="Amount">Amount</td>\n  <td class=xl65>Notes</td>\n  <td class=xl65>Empty</td>\n  <td class=xl65>Flag</td>\n </tr>\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>ARC-120 sample</td>\n  <td class=xl65>23/10/2026</td>\n  <td class=xl65 align=right x:num="1234567.89">1,234,567.89</td>\n  <td class=xl65>line one<br>line two</td>\n  <td></td>\n  <td class=xl65>TRUE</td>\n </tr>\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>Quote &quot;A&quot;</td>\n  <td class=xl65>01/01/2026</td>\n  <td class=xl65 align=right x:num="-42.50">-42.50</td>\n  <td class=xl65>single</td>\n  <td></td>\n  <td class=xl65>FALSE</td>\n </tr>\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>Percent</td>\n  <td></td>\n  <td class=xl65 align=right x:num="12.5">12.5%</td>\n  <td></td>\n  <td></td>\n  <td></td>\n </tr>\n<tr height=20 style=\'height:15.0pt\'>\n  <td class=xl65>Currency</td>\n  <td></td>\n  <td class=xl65 align=right x:num="9876.50">$9,876.50</td>\n  <td></td>\n  <td></td>\n  <td></td>\n </tr>\n</table>\n\n</body>\n\n</html>\n',
    sheets: null,
    expected: [
      ["Name", "Date", "Amount", "Notes", "Empty", "Flag"],
      [
        "ARC-120 sample",
        "23/10/2026",
        "1,234,567.89",
        "line one\nline two",
        "",
        "TRUE",
      ],
      ['Quote "A"', "01/01/2026", "-42.50", "single", "", "FALSE"],
      ["Percent", "", "12.5%", "", "", ""],
      ["Currency", "", "$9,876.50", "", "", ""],
    ],
  },
  {
    id: "numbers.documented.mixed-6x5",
    recorded: "documented",
    text: 'Name\tDate\tAmount\tNotes\tEmpty\tFlag\nARC-120 sample\t23/10/2026\t1,234,567.89\t"line one\nline two"\t\tTRUE\n"Quote ""A"""\t01/01/2026\t-42.50\tsingle\t\tFALSE\nPercent\t\t12.5%\t\t\t\nCurrency\t\t$9,876.50\t\t\t',
    html: '<meta charset="utf-8"><table><tbody><tr><td>Name</td><td>Date</td><td>Amount</td><td>Notes</td><td>Empty</td><td>Flag</td></tr><tr><td>ARC-120 sample</td><td>23/10/2026</td><td>1,234,567.89</td><td>line one<br>line two</td><td></td><td>TRUE</td></tr><tr><td>Quote "A"</td><td>01/01/2026</td><td>-42.50</td><td>single</td><td></td><td>FALSE</td></tr><tr><td>Percent</td><td></td><td>12.5%</td><td></td><td></td><td></td></tr><tr><td>Currency</td><td></td><td>$9,876.50</td><td></td><td></td><td></td></tr></tbody></table>',
    sheets: null,
    expected: [
      ["Name", "Date", "Amount", "Notes", "Empty", "Flag"],
      [
        "ARC-120 sample",
        "23/10/2026",
        "1,234,567.89",
        "line one\nline two",
        "",
        "TRUE",
      ],
      ['Quote "A"', "01/01/2026", "-42.50", "single", "", "FALSE"],
      ["Percent", "", "12.5%", "", "", ""],
      ["Currency", "", "$9,876.50", "", "", ""],
    ],
  },
  {
    id: "airtable.documented.mixed-6x5",
    recorded: "documented",
    text: 'Name\tDate\tAmount\tNotes\tEmpty\tFlag\nARC-120 sample\t23/10/2026\t1,234,567.89\t"line one\nline two"\t\tTRUE\n"Quote ""A"""\t01/01/2026\t-42.50\tsingle\t\tFALSE\nPercent\t\t12.5%\t\t\t\nCurrency\t\t$9,876.50\t\t\t',
    html: null,
    sheets: null,
    expected: [
      ["Name", "Date", "Amount", "Notes", "Empty", "Flag"],
      [
        "ARC-120 sample",
        "23/10/2026",
        "1,234,567.89",
        "line one\nline two",
        "",
        "TRUE",
      ],
      ['Quote "A"', "01/01/2026", "-42.50", "single", "", "FALSE"],
      ["Percent", "", "12.5%", "", "", ""],
      ["Currency", "", "$9,876.50", "", "", ""],
    ],
  },
  {
    id: "google-sheets.documented.multiline-separators-6x5",
    recorded: "documented",
    text: 'Name\tDate\tAmount\tNotes\tEmpty\tFlag\nARC-120 sample\t23/10/2026\t1,234,567.89\t"line one\nline two"\t\tTRUE\n"Quote ""A"""\t01/01/2026\t-42.50\tsingle\t\tFALSE\nPercent\t\t12.5%\t\t\t\nCurrency\t\t$9,876.50\t\t\t',
    html: null,
    sheets: null,
    expected: [
      ["Name", "Date", "Amount", "Notes", "Empty", "Flag"],
      [
        "ARC-120 sample",
        "23/10/2026",
        "1,234,567.89",
        "line one\nline two",
        "",
        "TRUE",
      ],
      ['Quote "A"', "01/01/2026", "-42.50", "single", "", "FALSE"],
      ["Percent", "", "12.5%", "", "", ""],
      ["Currency", "", "$9,876.50", "", "", ""],
    ],
  },
];

const texts = (matrix: GridClipboardCell[][]) =>
  matrix.map((row) => row.map((cell) => cell.text));

for (const fixture of FIXTURES) {
  test(`${fixture.id}: the paste yields the displayed matrix`, () => {
    const matrix = parseClipboard({
      text: fixture.text ?? undefined,
      html: fixture.html ?? undefined,
      sheets: fixture.sheets ?? undefined,
    });
    expect(texts(matrix)).toEqual(fixture.expected);
  });
  if (fixture.html)
    test(`${fixture.id}: the HTML alone keeps the same shape`, () => {
      const matrix = parseHtmlTable(fixture.html!)!;
      expect(matrix).not.toBeNull();
      expect(matrix.length).toBe(fixture.expected.length);
      expect(matrix[0]!.length).toBe(fixture.expected[0]!.length);
    });
}

test("Google Sheets' compact table supplies the exact numbers behind displayed ones", () => {
  const fixture = FIXTURES.find(
    (f) => f.id === "google-sheets.live.numbers-empties-5x4",
  )!;
  const matrix = parseClipboard({
    text: fixture.text!,
    html: fixture.html!,
    sheets: fixture.sheets!,
  });
  // "0.1086622782" on screen; the stored value is exact.
  expect(matrix[1]![1]).toEqual({
    text: "0.1086622782",
    number: 0.10866227820675683,
  });
  expect(matrix[1]![0]!.number).toBeUndefined();
  expect(matrix[3]![3]).toEqual({ text: "44.7", number: 44.7 });
});

test("a compact table that does not line up with the text is ignored", () => {
  const matrix = parseClipboard({
    text: "1\t2",
    sheets: JSON.stringify({ "3": { "1": [1], "3": [9] } }),
  });
  expect(matrix).toEqual([[{ text: "1" }, { text: "2" }]]);
});

test("parseTsv: row ends, one trailing row end dropped, trailing empty fields kept", () => {
  expect(parseTsv("a\tb\r\nc\td\r\n")).toEqual([
    ["a", "b"],
    ["c", "d"],
  ]);
  expect(parseTsv("a\tb\rc\td")).toEqual([
    ["a", "b"],
    ["c", "d"],
  ]);
  expect(parseTsv("a\t\t\nb")).toEqual([
    ["a", "", ""],
    ["b", "", ""],
  ]);
  expect(parseTsv("")).toEqual([]);
  expect(parseTsv("\n")).toEqual([[""]]);
});

test("parseTsv: quotes only at a field's start; doubled quotes; tabs and breaks inside", () => {
  expect(parseTsv('"line one\r\nline two"\t"Quote ""A"""\t"a\tb"')).toEqual([
    ["line one\nline two", 'Quote "A"', "a\tb"],
  ]);
  // A quote that does not open the field is literal.
  expect(parseTsv('5" screen\tok')).toEqual([['5" screen', "ok"]]);
  // A malformed quoted field keeps its quote as text.
  expect(parseTsv('"abc"def\tx')).toEqual([['"abc"def', "x"]]);
});

test("serializeTsv round-trips through parseTsv", () => {
  const rows = [
    ["Name", "Notes", ""],
    ["SR-12", "line one\nline two", '"quoted"'],
    ["tab\there", "", "end"],
  ];
  expect(parseTsv(serializeTsv(rows))).toEqual(rows);
});

test("serializeHtmlTable writes a bare table with <br> breaks and escaped text", () => {
  const html = serializeHtmlTable([["a<b", "line\ntwo"]]);
  expect(html).toBe(
    "<table><tbody><tr><td>a&lt;b</td><td>line<br>two</td></tr></tbody></table>",
  );
  expect(texts(parseHtmlTable(html)!)).toEqual([["a<b", "line\ntwo"]]);
});

test("parseHtmlTable: merged cells keep the value top-left; scripts never run", () => {
  (window as unknown as { pwned?: boolean }).pwned = false;
  const matrix = parseHtmlTable(
    '<table><tr><td colspan="2" rowspan="2">M</td><td>c</td></tr><tr><td>f</td></tr>' +
      '<tr><td><img src=x onerror="window.pwned=true">g</td><td>h</td><td>i</td></tr></table>',
  )!;
  expect(texts(matrix)).toEqual([
    ["M", "", "c"],
    ["", "", "f"],
    ["g", "h", "i"],
  ]);
  expect((window as unknown as { pwned?: boolean }).pwned).toBe(false);
  expect(parseHtmlTable("<p>no table</p>")).toBeNull();
});

test("expandPaste: one value fills the range, an even divisor tiles, anything else keeps its size", () => {
  expect(expandPaste({ rows: 2, columns: 3 }, [["x"]])).toEqual([
    ["x", "x", "x"],
    ["x", "x", "x"],
  ]);
  expect(expandPaste({ rows: 4, columns: 1 }, [["a"], ["b"]])).toEqual([
    ["a"],
    ["b"],
    ["a"],
    ["b"],
  ]);
  expect(expandPaste({ rows: 3, columns: 1 }, [["a"], ["b"]])).toEqual([
    ["a"],
    ["b"],
  ]);
  expect(expandPaste({ rows: 1, columns: 1 }, [])).toEqual([]);
});

test("an empty quoted field is a cell; a trailing row of one empty cell survives the round trip", () => {
  expect(parseTsv('""')).toEqual([[""]]);
  expect(parseTsv('a\n""')).toEqual([["a"], [""]]);
  const rows = [["a"], [""]];
  expect(parseTsv(serializeTsv(rows))).toEqual(rows);
});

test("hostile HTML spans are bounded: no endless expansion", () => {
  const matrix = parseHtmlTable(
    '<table><tr><td colspan="Infinity">x</td><td rowspan="1e9">y</td></tr></table>',
  )!;
  expect(matrix.length).toBeLessThanOrEqual(1000);
  expect(matrix[0]![0]!.text).toBe("x");
});

test("a compact table whose size differs from the text's is not trusted", () => {
  const sheets = JSON.stringify({
    "3": { "1": [1, 1], "3": [5, 6] },
    "15": { "1": 2, "2": 1 },
  });
  expect(parseClipboard({ text: "1\t2", sheets })).toEqual([
    [{ text: "1" }, { text: "2" }],
  ]);
  const fits = JSON.stringify({
    "3": { "1": [1, 1], "3": [5, 6] },
    "15": { "1": 1, "2": 2 },
  });
  expect(parseClipboard({ text: "1\t2", sheets: fits })).toEqual([
    [
      { text: "1", number: 5 },
      { text: "2", number: 6 },
    ],
  ]);
});
