var texts = ["Loc:16241 ROUTE 62 XSt:MAPLE LN REDBUD LN Grid:L08D Units: Rmk:STRUCTURE FIRE UNDER THE HOUSE.\n\n", "Loc:35210 ROUTE 6 XSt:TUSSEY LN NELSON HILL RD Grid:D08B Units: Rmk:60 YEAR OLD MALE FAINT,VOMITING, 31-D-4\n\n"]

for (var i = 0; i < texts.length; i++) {

  var testRE = texts[i].match("Loc:(.*)XSt");
  if (testRE) {
    console.log(testRE[1]);
  } else {
    var testRE2 = texts[i].match("(.*)XSt");
    if (testRE2) {
      console.log(testRE2[1]);
    } else
    console.log('No address found.');
  }
}

console.log(30000/1000);
