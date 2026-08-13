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

  it("carries the due date it was given", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");

    const todo = list.add("buy milk", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("comes back undated when no due date was given", () => {
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
    const existing = list.add("buy milk");

    expect(() => list.add("buy eggs", new Date("not a date"))).toThrow(InvalidDueDateError);
    expect(list.list()).toEqual([existing]);
  });

  it("does not gain or change a due date underneath a caller when they mutate the date they passed in", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");

    const todo = list.add("buy milk", dueDate);
    dueDate.setFullYear(1999);

    expect(list.get(todo.id).dueDate).toEqual(new Date("2026-01-01"));
  });

  it("does not let a caller change the stored due date by mutating the todo handed back", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");

    const todo = list.add("buy milk", dueDate);
    todo.dueDate?.setFullYear(1999);

    expect(list.get(todo.id).dueDate).toEqual(new Date("2026-01-01"));
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

  it("refuses a title that is empty once trimmed", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    expect(() => list.rename(added.id, "")).toThrow(InvalidTitleError);
    expect(list.get(added.id).title).toBe("buy milk");
  });

  it("leaves its due date as it was", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const added = list.add("buy milk", dueDate);

    const renamed = list.rename(added.id, "buy oat milk");

    expect(renamed.dueDate).toEqual(dueDate);
  });
});

describe("completing and reopening a todo", () => {
  it("completes an open todo", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    expect(list.complete(added.id).completed).toBe(true);
  });

  it("reopens a completed todo", () => {
    const list = new TodoList();
    const added = list.add("buy milk");
    list.complete(added.id);

    expect(list.reopen(added.id).completed).toBe(false);
  });

  it("leaves the todo handed out earlier unchanged", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    list.complete(added.id);

    expect(added.completed).toBe(false);
  });

  it("refuses an id the list does not hold", () => {
    const list = new TodoList();

    expect(() => list.complete("nope")).toThrow(UnknownTodoError);
    expect(() => list.reopen("nope")).toThrow(UnknownTodoError);
  });

  it("leaves the due date as it was when completed and reopened", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const added = list.add("buy milk", dueDate);

    const completed = list.complete(added.id);
    const reopened = list.reopen(added.id);

    expect(completed.dueDate).toEqual(dueDate);
    expect(reopened.dueDate).toEqual(dueDate);
  });

  it("does not change the due date of a todo handed out earlier", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const added = list.add("buy milk", dueDate);

    list.complete(added.id);

    expect(added.dueDate).toEqual(dueDate);
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

describe("asking for due-date order", () => {
  it("answers dated todos soonest due date first, whatever order they were added in", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-03-01"));
    const sooner = list.add("sooner", new Date("2026-01-01"));

    expect(list.list("all", "dueDate")).toEqual([sooner, later]);
  });

  it("puts every undated todo after every dated one", () => {
    const list = new TodoList();
    const undated = list.add("undated");
    const dated = list.add("dated", new Date("2026-01-01"));

    expect(list.list("all", "dueDate")).toEqual([dated, undated]);
  });

  it("keeps the order they were added in among todos sharing a due date", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const first = list.add("first", dueDate);
    const second = list.add("second", dueDate);

    expect(list.list("all", "dueDate")).toEqual([first, second]);
  });

  it("keeps the order they were added in among undated todos", () => {
    const list = new TodoList();
    const first = list.add("first");
    const second = list.add("second");

    expect(list.list("all", "dueDate")).toEqual([first, second]);
  });

  it("orders the open filter by due date", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-03-01"));
    const sooner = list.add("sooner", new Date("2026-01-01"));
    const completed = list.add("completed", new Date("2025-01-01"));
    list.complete(completed.id);

    expect(list.list("open", "dueDate")).toEqual([sooner, later]);
  });

  it("orders the completed filter by due date", () => {
    const list = new TodoList();
    const laterAdded = list.add("later", new Date("2026-03-01"));
    const soonerAdded = list.add("sooner", new Date("2026-01-01"));
    const later = list.complete(laterAdded.id);
    const sooner = list.complete(soonerAdded.id);

    expect(list.list("completed", "dueDate")).toEqual([sooner, later]);
  });

  it("answers a listing with no order given in the order todos were added", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-03-01"));
    const sooner = list.add("sooner", new Date("2026-01-01"));

    expect(list.list("all")).toEqual([later, sooner]);
  });
});

describe("asking which todos are overdue", () => {
  it("counts a dated, open todo due before the supplied now as overdue", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    const todo = list.add("buy milk", new Date("2026-01-01"));

    expect(list.overdue()).toEqual([todo]);
  });

  it("does not count a dated, open todo due after the supplied now as overdue", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date("2026-02-01"));

    expect(list.overdue()).toEqual([]);
  });

  it("does not count a todo due exactly at the supplied now as overdue", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date(now));

    expect(list.overdue()).toEqual([]);
  });

  it("does not count a completed todo with a long-past due date as overdue", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    const todo = list.add("buy milk", new Date("2000-01-01"));
    list.complete(todo.id);

    expect(list.overdue()).toEqual([]);
  });

  it("does not count an undated todo as overdue", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    list.add("not overdue", new Date("2026-02-01"));
    const first = list.add("first overdue", new Date("2026-01-01"));
    const second = list.add("second overdue", new Date("2026-01-02"));

    expect(list.overdue()).toEqual([first, second]);
  });

  it("measures a list built with no clock against the real one", () => {
    const list = new TodoList();
    const overdue = list.add("long past", new Date("1970-01-01"));
    list.add("far future", new Date("3000-01-01"));

    expect(list.overdue()).toEqual([overdue]);
  });
});
