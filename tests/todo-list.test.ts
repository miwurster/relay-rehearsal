import { describe, expect, it } from "vitest";

import { InvalidDueDateError, InvalidTitleError, TodoList, UnknownTodoError } from "../src/index.js";

describe("adding a todo", () => {
  it("adds it open, under a title trimmed of its whitespace", () => {
    const list = new TodoList();

    const todo = list.add("  buy milk  ");

    expect(todo.title).toBe("buy milk");
    expect(todo.completed).toBe(false);
  });

  it("gives every todo an id of its own", () => {
    const list = new TodoList();

    const first = list.add("buy milk");
    const second = list.add("buy milk");

    expect(second.id).not.toBe(first.id);
  });

  it("refuses a title that is empty once trimmed", () => {
    const list = new TodoList();

    expect(() => list.add("   ")).toThrow(InvalidTitleError);
    expect(list.list()).toHaveLength(0);
  });

  it("spends no id on a refused title", () => {
    const refused = new TodoList();
    expect(() => refused.add("   ")).toThrow(InvalidTitleError);
    const untouched = new TodoList();

    expect(refused.add("buy milk").id).toBe(untouched.add("buy milk").id);
  });
});

describe("adding a todo with a due date", () => {
  it("carries the due date it was given", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");

    const todo = list.add("buy milk", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("comes back undated when no due date is given", () => {
    const list = new TodoList();

    const todo = list.add("buy milk");

    expect(todo.dueDate).toBeUndefined();
  });

  it("accepts a due date in the past", () => {
    const list = new TodoList();
    const pastDueDate = new Date("2000-01-01");

    const todo = list.add("buy milk", pastDueDate);

    expect(todo.dueDate).toEqual(pastDueDate);
  });

  it("refuses a due date that is not a usable point in time", () => {
    const list = new TodoList();

    expect(() => list.add("buy milk", new Date("not a date"))).toThrow(InvalidDueDateError);
    expect(list.list()).toHaveLength(0);
  });

  it("spends no id on a refused due date", () => {
    const refused = new TodoList();
    expect(() => refused.add("buy milk", new Date("not a date"))).toThrow(InvalidDueDateError);
    const untouched = new TodoList();

    expect(refused.add("buy milk").id).toBe(untouched.add("buy milk").id);
  });

  it("does not gain a changed due date when the caller's own Date is mutated after adding", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");

    const todo = list.add("buy milk", dueDate);
    dueDate.setFullYear(2099);

    expect(todo.dueDate).toEqual(new Date("2026-08-10"));
  });

  it("does not change underneath the list when a due date handed back is mutated", () => {
    const list = new TodoList();
    const added = list.add("buy milk", new Date("2026-08-10"));

    added.dueDate?.setFullYear(2099);

    expect(list.get(added.id).dueDate).toEqual(new Date("2026-08-10"));
  });
});

describe("reading a todo", () => {
  it("answers the todo the id names", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    expect(list.get(added.id)).toEqual(added);
  });

  it("refuses an id the list does not hold", () => {
    const list = new TodoList();

    expect(() => list.get("nope")).toThrow(UnknownTodoError);
  });
});

describe("renaming a todo", () => {
  it("keeps its id and its completion", () => {
    const list = new TodoList();
    const added = list.add("buy milk");
    list.complete(added.id);

    const renamed = list.rename(added.id, "buy oat milk");

    expect(renamed).toEqual({ id: added.id, title: "buy oat milk", completed: true });
  });

  it("keeps its due date", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
    const added = list.add("buy milk", dueDate);

    const renamed = list.rename(added.id, "buy oat milk");

    expect(renamed.dueDate).toEqual(dueDate);
  });

  it("refuses a title that is empty once trimmed", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    expect(() => list.rename(added.id, "")).toThrow(InvalidTitleError);
    expect(list.get(added.id).title).toBe("buy milk");
  });
});

describe("completing and reopening a todo", () => {
  it("completes an open todo", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    expect(list.complete(added.id).completed).toBe(true);
  });

  it("keeps its due date when completed", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
    const added = list.add("buy milk", dueDate);

    expect(list.complete(added.id).dueDate).toEqual(dueDate);
  });

  it("reopens a completed todo", () => {
    const list = new TodoList();
    const added = list.add("buy milk");
    list.complete(added.id);

    expect(list.reopen(added.id).completed).toBe(false);
  });

  it("keeps its due date when reopened", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
    const added = list.add("buy milk", dueDate);
    list.complete(added.id);

    expect(list.reopen(added.id).dueDate).toEqual(dueDate);
  });

  it("leaves the todo handed out earlier unchanged", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    list.complete(added.id);

    expect(added.completed).toBe(false);
  });

  it("does not gain a due date underneath a todo handed out earlier", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    list.complete(added.id);

    expect(added.dueDate).toBeUndefined();
  });

  it("refuses an id the list does not hold", () => {
    const list = new TodoList();

    expect(() => list.complete("nope")).toThrow(UnknownTodoError);
    expect(() => list.reopen("nope")).toThrow(UnknownTodoError);
  });
});

describe("removing a todo", () => {
  it("takes it out of the list", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    list.remove(added.id);

    expect(list.list()).toHaveLength(0);
  });

  it("refuses an id the list does not hold", () => {
    const list = new TodoList();

    expect(() => list.remove("nope")).toThrow(UnknownTodoError);
  });
});

describe("listing todos", () => {
  it("answers them in the order they were added", () => {
    const list = new TodoList();
    list.add("first");
    list.add("second");

    expect(list.list().map((todo) => todo.title)).toEqual(["first", "second"]);
  });

  it("answers only the open ones when asked for open", () => {
    const list = new TodoList();
    const milk = list.add("buy milk");
    list.add("buy bread");
    list.complete(milk.id);

    expect(list.list("open").map((todo) => todo.title)).toEqual(["buy bread"]);
  });

  it("answers only the completed ones when asked for completed", () => {
    const list = new TodoList();
    const milk = list.add("buy milk");
    list.add("buy bread");
    list.complete(milk.id);

    expect(list.list("completed").map((todo) => todo.title)).toEqual(["buy milk"]);
  });

  it("answers an empty list when nothing has been added", () => {
    expect(new TodoList().list()).toEqual([]);
  });

  it("keeps a todo where it was when it is completed or renamed", () => {
    const list = new TodoList();
    list.add("first");
    const second = list.add("second");
    list.add("third");

    list.complete(second.id);
    list.rename(second.id, "renamed");

    expect(list.list().map((todo) => todo.title)).toEqual(["first", "renamed", "third"]);
  });

  it("answers a listing that a later add does not reach", () => {
    const list = new TodoList();
    list.add("buy milk");

    const listing = list.list();
    list.add("buy bread");

    expect(listing).toHaveLength(1);
  });
});

describe("listing todos in due-date order", () => {
  it("answers dated todos soonest first, whatever order they were added in", () => {
    const list = new TodoList();
    list.add("later", new Date("2026-09-01"));
    list.add("sooner", new Date("2026-08-01"));

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["sooner", "later"]);
  });

  it("puts every undated todo after every dated one", () => {
    const list = new TodoList();
    list.add("undated");
    list.add("dated", new Date("2026-08-01"));

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["dated", "undated"]);
  });

  it("keeps todos sharing a due date in the order they were added", () => {
    const list = new TodoList();
    const sameDueDate = new Date("2026-08-15");
    list.add("first", sameDueDate);
    list.add("second", sameDueDate);
    list.add("earlier", new Date("2026-08-01"));

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["earlier", "first", "second"]);
  });

  it("keeps undated todos in the order they were added, among themselves", () => {
    const list = new TodoList();
    list.add("first");
    list.add("second");
    list.add("dated", new Date("2026-08-01"));

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["dated", "first", "second"]);
  });

  it("partitions dated before undated while keeping each group's add order", () => {
    const list = new TodoList();
    list.add("A");
    list.add("sep", new Date("2026-09-01"));
    list.add("B");
    list.add("aug", new Date("2026-08-01"));

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["aug", "sep", "A", "B"]);
  });

  it("is available with every filter", () => {
    const list = new TodoList();
    list.add("oat", new Date("2026-09-01"));
    list.add("rye", new Date("2026-08-01"));
    const milk = list.add("milk", new Date("2026-09-01"));
    const bread = list.add("bread", new Date("2026-08-01"));
    list.complete(milk.id);
    list.complete(bread.id);

    expect(list.list("open", "due-date").map((todo) => todo.title)).toEqual(["rye", "oat"]);
    expect(list.list("completed", "due-date").map((todo) => todo.title)).toEqual(["bread", "milk"]);
  });

  it("answers in the order todos were added when no order is asked for", () => {
    const list = new TodoList();
    list.add("later", new Date("2026-09-01"));
    list.add("sooner", new Date("2026-08-01"));

    expect(list.list().map((todo) => todo.title)).toEqual(["later", "sooner"]);
  });
});

describe("listing overdue todos", () => {
  const now = new Date("2026-08-01T12:00:00Z");

  it("includes a dated, open todo due before the supplied now", () => {
    const list = new TodoList(() => now);
    list.add("buy milk", new Date("2026-07-01"));

    expect(list.overdue().map((todo) => todo.title)).toEqual(["buy milk"]);
  });

  it("excludes a dated, open todo due after the supplied now", () => {
    const list = new TodoList(() => now);
    list.add("buy milk", new Date("2026-09-01"));

    expect(list.overdue()).toEqual([]);
  });

  it("excludes a todo due exactly at the supplied now", () => {
    const list = new TodoList(() => now);
    list.add("buy milk", new Date(now.getTime()));

    expect(list.overdue()).toEqual([]);
  });

  it("excludes a completed todo with a long-past due date", () => {
    const list = new TodoList(() => now);
    const milk = list.add("buy milk", new Date("2000-01-01"));
    list.complete(milk.id);

    expect(list.overdue()).toEqual([]);
  });

  it("excludes an undated todo", () => {
    const list = new TodoList(() => now);
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const list = new TodoList(() => now);
    list.add("first", new Date("2026-07-15"));
    list.add("undated");
    list.add("second", new Date("2026-07-01"));

    expect(list.overdue().map((todo) => todo.title)).toEqual(["first", "second"]);
  });

  it("measures each call against the clock's current now", () => {
    let currentNow = new Date("2026-07-10");
    const list = new TodoList(() => currentNow);
    list.add("buy milk", new Date("2026-07-20"));

    expect(list.overdue()).toEqual([]);

    currentNow = new Date("2026-07-25");

    expect(list.overdue().map((todo) => todo.title)).toEqual(["buy milk"]);
  });

  it("measures a list built with no clock against the real one", () => {
    const list = new TodoList();
    const overdue = list.add("buy milk", new Date("2000-01-01"));
    list.add("buy bread", new Date("3000-01-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([overdue.id]);
  });
});
