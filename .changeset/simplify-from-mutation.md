---
'timesolver': patch
---

Delete two guards and one branch that no test could ever exercise.

`parse` guarded against a capture group being absent, which cannot happen once the matcher has matched; `isValid` guarded against a non-string input, which `parse` already rejects with the same result; and `monthsBetween` special-cased a target sitting exactly on its anchor, which the general interpolation already handles because the numerator is zero there. All three were found by mutation testing: the guards could be deleted with no test failing, which is the definition of dead code.

No behaviour changed. Branch coverage rose to 100% as a side effect, since the unreachable branches are gone.
