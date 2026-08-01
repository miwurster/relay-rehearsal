# todo-app

This file is the project's glossary.
It names only the terms this repo coins or overloads — terms carrying their ordinary meaning (id, test, list) are left alone where nothing here bends them.

## The domain

**Todo**: one thing somebody means to do, carrying an **id**, a **title**, its completion and a **due date**.
A todo is read-only to callers: the **todo list** replaces it rather than mutating it, so a todo handed out earlier never changes underneath the code holding it.
_Avoid_: task, item, entry.

**Due date**: when a **todo** is meant to be done, set at most once, when it is added.
A due date in the past is ordinary, not an error.
Renaming, completing and reopening a todo all leave its due date as it was.
A due date that is not a usable point in time is refused with `InvalidDueDateError`.
_Avoid_: deadline, due by, target date.

**Undated**: a **todo** added without a **due date** — a state of its own, not a date waiting to be supplied.
_Avoid_: no due date, null date, missing date.

**Title**: the sentence a **todo** is named by, trimmed of surrounding whitespace and never empty.
A title that is empty once trimmed is not a title, and is refused with `InvalidTitleError`.
_Avoid_: name, description, label.

**Completion**: whether a **todo** is done, as the single boolean `completed`.
A todo is **open** until it is completed, and completing one is reversible — reopening it is ordinary, not a correction.
_Avoid_: status, state, done flag.

**Todo list**: the whole collection, and the only thing that creates a **todo** or changes one.
It hands out the **id**s itself, so nothing outside it invents one.
_Avoid_: store, repository, collection, database.

**Insertion order**: the order todos were added, which is the order a **listing** asked for with no order comes back in.
Changing a **todo** does not move it: completing or renaming one leaves it where it was.
_Avoid_: natural order, default order.

**Filter**: which **todo**s a **listing** asks for: `all`, `open`, or `completed`.
A filter says what a listing holds, never what order it holds it in.
_Avoid_: query, selector, predicate.

**Due-date order**: a **listing** sorted with the soonest **due date** first, and every **undated** todo after every dated one.
It is stable: todos sharing a due date keep their **insertion order** relative to each other, and so do the undated ones among themselves.
Every filter can be asked for in due-date order; a listing asked for with no order stays in insertion order, unchanged.
_Avoid_: sorted order, chronological order.

**Listing**: one answer from the **todo list** to a **filter** and an order, as a fresh array.
Holding a listing does not hold the list: a later add does not appear in a listing already returned.
_Avoid_: view, snapshot, result set.

**Clock**: where the **todo list** reads "now" from, supplied at construction.
A list built with no clock reads the real one; a list built with one is measured against that instead, which is what lets a test pin "now" rather than sleeping or drifting with the calendar.
_Avoid_: time source, now provider.

**Overdue**: a **todo** that is dated, **open**, and its **due date** is strictly before the **clock**'s now.
A todo due exactly at now is not overdue yet, a **completed** todo is never overdue however late, and an **undated** todo is never overdue.
The overdue answer comes back in **insertion order**.
_Avoid_: late, past due.
