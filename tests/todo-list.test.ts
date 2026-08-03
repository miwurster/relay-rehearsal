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

  it("leaves the todo unchanged when the caller's due date is mutated afterwards", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");

    const todo = list.add("buy milk", dueDate);
    dueDate.setFullYear(2030);

    expect(todo.dueDate).toEqual(new Date("2026-01-01"));
  });

  it("comes back undated when given no due date", () => {
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

  it("keeps its due date", () => {
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

  it("keeps its due date through completing and reopening", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const added = list.add("buy milk", dueDate);

    const completed = list.complete(added.id);
    const reopened = list.reopen(added.id);

    expect(completed.dueDate).toEqual(dueDate);
    expect(reopened.dueDate).toEqual(dueDate);
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
  it("answers dated todos soonest due date first, whatever order they were added in", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-02-01"));
    const sooner = list.add("sooner", new Date("2026-01-01"));

    expect(list.list("all", "due-date").map((todo) => todo.id)).toEqual([sooner.id, later.id]);
  });

  it("answers every undated todo after every dated one", () => {
    const list = new TodoList();
    const undated = list.add("undated");
    const dated = list.add("dated", new Date("2026-01-01"));

    expect(list.list("all", "due-date").map((todo) => todo.id)).toEqual([dated.id, undated.id]);
  });

  it("keeps todos sharing a due date in the order they were added", () => {
    const list = new TodoList();
    const sameDueDate = new Date("2026-01-01");
    const first = list.add("first", sameDueDate);
    const second = list.add("second", sameDueDate);

    expect(list.list("all", "due-date").map((todo) => todo.id)).toEqual([first.id, second.id]);
  });

  it("keeps undated todos in the order they were added, among themselves", () => {
    const list = new TodoList();
    const dated = list.add("dated", new Date("2026-01-01"));
    const first = list.add("first undated");
    const second = list.add("second undated");

    expect(list.list("all", "due-date").map((todo) => todo.id)).toEqual([dated.id, first.id, second.id]);
  });

  it("applies to the open filter, alongside due-date order", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-02-01"));
    const sooner = list.add("sooner", new Date("2026-01-01"));
    list.complete(sooner.id);
    const alsoSooner = list.add("also sooner", new Date("2026-01-01"));

    expect(list.list("open", "due-date").map((todo) => todo.id)).toEqual([alsoSooner.id, later.id]);
  });

  it("applies to the completed filter, alongside due-date order", () => {
    const list = new TodoList();
    const sooner = list.add("sooner", new Date("2026-01-01"));
    const later = list.add("later", new Date("2026-02-01"));
    list.complete(later.id);
    list.complete(sooner.id);

    expect(list.list("completed", "due-date").map((todo) => todo.id)).toEqual([sooner.id, later.id]);
  });

  it("leaves a listing asked for with no order in the order todos were added", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-02-01"));
    const sooner = list.add("sooner", new Date("2026-01-01"));

    expect(list.list().map((todo) => todo.id)).toEqual([later.id, sooner.id]);
  });
});

describe("listing overdue todos", () => {
  it("includes a dated, open todo due before the clock's now", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    const todo = list.add("buy milk", new Date("2026-01-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([todo.id]);
  });

  it("excludes a dated, open todo due after the clock's now", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date("2026-02-01"));

    expect(list.overdue()).toEqual([]);
  });

  it("excludes a todo due exactly at the clock's now", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date(now.getTime()));

    expect(list.overdue()).toEqual([]);
  });

  it("excludes a completed todo with a long-past due date", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    const todo = list.add("buy milk", new Date("2000-01-01"));
    list.complete(todo.id);

    expect(list.overdue()).toEqual([]);
  });

  it("excludes an undated todo", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const now = new Date("2026-01-15");
    const list = new TodoList(() => now);
    list.add("not overdue", new Date("2026-02-01"));
    const first = list.add("first", new Date("2026-01-10"));
    const second = list.add("second", new Date("2026-01-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([first.id, second.id]);
  });

  it("reads the real clock when constructed with none", () => {
    const list = new TodoList();
    const overdue = list.add("long overdue", new Date("2000-01-01"));
    list.add("not due yet", new Date("2999-01-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([overdue.id]);
  });
});
