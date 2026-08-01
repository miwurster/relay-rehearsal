# todo-app

This file is the project's glossary.
It names only the terms this repo coins or overloads — terms carrying their ordinary meaning (id, test, list) are left alone where nothing here bends them.

## The domain

**Todo**: one thing somebody means to do, carrying an **id**, a **title**, its completion and a **due date** (or **undated**).
A todo is read-only to callers: the **todo list** replaces it rather than mutating it, so a todo handed out earlier never changes underneath the code holding it.
_Avoid_: task, item, entry.

**Title**: the sentence a **todo** is named by, trimmed of surrounding whitespace and never empty.
A title that is empty once trimmed is not a title, and is refused with `InvalidTitleError`.
_Avoid_: name, description, label.

**Completion**: whether a **todo** is done, as the single boolean `completed`.
A todo is **open** until it is completed, and completing one is reversible — reopening it is ordinary, not a correction.
_Avoid_: status, state, done flag.

**Due date**: the point in time a **todo** is meant to be done by, given only when it is added.
A due date in the past is accepted — a todo somebody is already late on is ordinary, not an error.
A due date that is not a usable point in time is refused with `InvalidDueDateError`, before it joins the list.
Once a todo has a due date, renaming, completing and reopening it leave the due date as it was.
_Avoid_: deadline, target date, due.

**Undated**: a **todo** added without a **due date** — a state of its own, not a date waiting to be supplied.
_Avoid_: no date, null date, missing date.

**Todo list**: the whole collection, and the only thing that creates a **todo** or changes one.
It hands out the **id**s itself, so nothing outside it invents one.
_Avoid_: store, repository, collection, database.

**Insertion order**: the order todos were added, which is the order a **listing** comes back in today.
Changing a **todo** does not move it: completing or renaming one leaves it where it was.
_Avoid_: natural order, default order.

**Filter**: which **todo**s a **listing** asks for: `all`, `open`, or `completed`.
A filter says what a listing holds, never what order it holds it in.
_Avoid_: query, selector, predicate.

**Listing**: one answer from the **todo list** to a **filter**, as a fresh array.
Holding a listing does not hold the list: a later add does not appear in a listing already returned.
_Avoid_: view, snapshot, result set.

**Overdue**: a **todo** that is dated, still **open**, and due before the **clock**'s now, in **insertion order**.
A todo due exactly at now is not yet overdue, a completed todo is never overdue, and an **undated** todo is never overdue.
_Avoid_: late, past due.

**Clock**: what the **todo list** reads now from, supplied when the list is constructed.
A list constructed with none reads the real clock; one constructed with a clock is measured against that instead, which is what lets a test pin now rather than sleeping or drifting with the calendar.
_Avoid_: time source, now function.
