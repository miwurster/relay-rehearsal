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

**Due date**: the point in time a **todo** is meant to be done by, set only when it is added.
A due date is optional: a **todo** added without one is **undated**, a state of its own rather than a date waiting to be supplied.
A due date in the past is ordinary, not an error.
One that is not a usable point in time is refused with `InvalidDueDateError`.
Renaming, completing and reopening a **todo** all leave its due date as it was.
_Avoid_: deadline, due, target date.

**Overdue**: a **todo** that is dated, open, and due before now.
A **todo** due exactly now is not overdue yet, a completed **todo** is never overdue, and an undated **todo** is never overdue.
_Avoid_: late, past due.

**Todo list**: the whole collection, and the only thing that creates a **todo** or changes one.
It hands out the **id**s itself, so nothing outside it invents one.
_Avoid_: store, repository, collection, database.

**Insertion order**: the order todos were added, and the order a **listing** comes back in when it is not asked for another.
Changing a **todo** does not move it: completing or renaming one leaves it where it was.
_Avoid_: natural order, default order.

**Filter**: which **todo**s a **listing** asks for: `all`, `open`, `completed`, or `overdue`.
A filter says what a listing holds, never what order it holds it in.
_Avoid_: query, selector, predicate.

**Clock**: what the **todo list** reads now from, to decide what is **overdue**.
A **todo list** built without one reads the real clock; one built with a clock is measured against that instead, which is what lets a test pin now rather than sleeping or drifting with the calendar.
_Avoid_: time source, now function.

**Listing**: one answer from the **todo list** to what a caller asked of it, as a fresh array.
Holding a listing does not hold the list: a later add does not appear in a listing already returned.
_Avoid_: view, snapshot, result set.
