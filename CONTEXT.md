# todo-app

This file is the project's glossary.
It names only the terms this repo coins or overloads — terms carrying their ordinary meaning (id, test, list) are left alone where nothing here bends them.

## The domain

Every entry keeps one shape: the bold term and its definition on one line, each further fact on its own line, then an `_Avoid_:` line of the synonyms this repo does not use.
Where a named error refuses a value, the entry names that error, as **Title** does.

**Todo**: one thing somebody means to do, carrying an **id**, a **title**, its completion and a **due date**.
A todo is read-only to callers: the **todo list** replaces it rather than mutating it, so a todo handed out earlier never changes underneath the code holding it.
_Avoid_: task, item, entry.

**Title**: the sentence a **todo** is named by, trimmed of surrounding whitespace and never empty.
A title that is empty once trimmed is not a title, and is refused with `InvalidTitleError`.
_Avoid_: name, description, label.

**Completion**: whether a **todo** is done, as the single boolean `completed`.
A todo is **open** until it is completed, and completing one is reversible — reopening it is ordinary, not a correction.
_Avoid_: status, state, done flag.

**Todo list**: the whole collection, and the only thing that creates a **todo** or changes one.
It hands out the **id**s itself, so nothing outside it invents one.
_Avoid_: store, repository, collection, database.

**Due date**: when a **todo** is meant to be done, given optionally when it is added.
A due date in the past is accepted — a todo already late on it is ordinary, not an error.
A due date that is not a usable point in time is refused with `InvalidDueDateError`.
Renaming, completing and reopening a todo all leave its due date as it was.
_Avoid_: deadline, target date, due.

**Undated**: a **todo** added without a **due date**.
Undated is a state of its own, not a date waiting to be supplied, and it is distinguishable from a todo carrying any date.
_Avoid_: no due date, empty date, unset date.

**Insertion order**: the order todos were added, and the order a **listing** comes back in when it is not asked for another.
Changing a **todo** does not move it: completing or renaming one leaves it where it was.
_Avoid_: natural order, default order.

**Filter**: which **todo**s a **listing** asks for: `all`, `open`, or `completed`.
A filter says what a listing holds, never what order it holds it in.
_Avoid_: query, selector, predicate.

**Listing**: one answer from the **todo list** to what a caller asked of it, as a fresh array.
Holding a listing does not hold the list: a later add does not appear in a listing already returned.
_Avoid_: view, snapshot, result set.
