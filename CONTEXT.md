# todo-app

This file is the project's glossary.
It names only the terms this repo coins or overloads — terms carrying their ordinary meaning (id, test, list) are left alone where nothing here bends them.

## The domain

**Todo**: one thing somebody means to do, carrying an **id**, a **title**, its completion and a **due date**.
A todo is read-only to callers: the **todo list** replaces it rather than mutating it, so a todo handed out earlier never changes underneath the code holding it.
_Avoid_: task, item, entry.

**Title**: the sentence a **todo** is named by, trimmed of surrounding whitespace and never empty.
A title that is empty once trimmed is not a title, and is refused with `InvalidTitleError`.
_Avoid_: name, description, label.

**Completion**: whether a **todo** is done, as the single boolean `completed`.
A todo is **open** until it is completed, and completing one is reversible — reopening it is ordinary, not a correction.
_Avoid_: status, state, done flag.

**Due date**: the point in time a **todo** is meant to be done by, given optionally when the todo is added and kept as it was through renaming, completing and reopening.
A due date in the past is ordinary, not an error; a due date that is not a usable point in time is refused with `InvalidDueDateError`.
_Avoid_: deadline, target date.

**Undated**: a **todo** added with no **due date** — a state of its own, not a date waiting to be supplied.
_Avoid_: no due date, null date.

**Todo list**: the whole collection, and the only thing that creates a **todo** or changes one.
It hands out the **id**s itself, so nothing outside it invents one.
_Avoid_: store, repository, collection, database.

**Insertion order**: the order todos were added, which is the order a **listing** comes back in today.
Changing a **todo** does not move it: completing or renaming one leaves it where it was.
_Avoid_: natural order, default order.

**Filter**: which **todo**s a **listing** asks for: `all`, `open`, or `completed`.
A filter says what a listing holds, never what order it holds it in.
_Avoid_: query, selector, predicate.

**Due-date order**: a **listing** ordered by **due date**, soonest first, with every **undated** todo after every dated one.
Todos sharing a due date, and undated todos among themselves, keep **insertion order** relative to each other. Any filter can be asked for in this order; **insertion order** stays the default when none is given.
_Avoid_: date order, sorted order.

**Listing**: one answer from the **todo list** to a **filter**, as a fresh array.
Holding a listing does not hold the list: a later add does not appear in a listing already returned.
_Avoid_: view, snapshot, result set.

**Clock**: the source of now a **todo list** reads, given optionally at construction and reading the real clock when none is given.
This is what lets a test pin now rather than sleeping or drifting with the calendar, and it is part of the list's public API rather than an internal detail.
_Avoid_: time source, now provider.

**Overdue**: a **todo** that is dated, open, and due before the **todo list**'s **clock**'s now.
A todo due exactly at now is not overdue yet, a completed todo is never overdue however long past its due date, and an **undated** todo is never overdue.
_Avoid_: late, past due.
