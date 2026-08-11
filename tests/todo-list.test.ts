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

  it("carries the due date it was added with", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");

    const todo = list.add("buy milk", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("comes back undated when added without a due date", () => {
    const list = new TodoList();

    const todo = list.add("buy milk");

    expect(todo.dueDate).toBeUndefined();
  });

  it("accepts a due date in the past", () => {
    const list = new TodoList();
    const past = new Date("2000-01-01");

    const todo = list.add("buy milk", past);

    expect(todo.dueDate).toEqual(past);
  });

  it("refuses a due date that is not a usable point in time", () => {
    const list = new TodoList();

    expect(() => list.add("buy milk", new Date("not a date"))).toThrow(InvalidDueDateError);
    expect(list.list()).toHaveLength(0);
  });

  it("does not gain or change a due date when the Date passed in or handed back is mutated", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");

    const todo = list.add("buy milk", dueDate);
    dueDate.setFullYear(2099);
    todo.dueDate?.setFullYear(2099);

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

  it("leaves its due date as it was added", () => {
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

  it("leaves the due date as it was added when completing and reopening", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const added = list.add("buy milk", dueDate);

    const completed = list.complete(added.id);
    const reopened = list.reopen(added.id);

    expect(completed.dueDate).toEqual(dueDate);
    expect(reopened.dueDate).toEqual(dueDate);
  });

  it("does not gain or change a due date on the todo handed out earlier", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const added = list.add("buy milk", dueDate);

    list.complete(added.id);
    list.rename(added.id, "buy oat milk");

    expect(added.dueDate).toEqual(dueDate);
  });

  it("does not gain a due date on an undated todo handed out earlier", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    list.complete(added.id);
    list.rename(added.id, "buy oat milk");

    expect(added.dueDate).toBeUndefined();
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
    list.add("later", new Date("2026-03-01"));
    list.add("soonest", new Date("2026-01-01"));
    list.add("middle", new Date("2026-02-01"));

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["soonest", "middle", "later"]);
  });

  it("puts every undated todo after every dated one", () => {
    const list = new TodoList();
    list.add("undated");
    list.add("dated", new Date("2026-01-01"));

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["dated", "undated"]);
  });

  it("keeps the order added among todos sharing a due date", () => {
    const list = new TodoList();
    const sharedDate = new Date("2026-01-01");
    list.add("first", sharedDate);
    list.add("second", sharedDate);

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["first", "second"]);
  });

  it("keeps the order added among undated todos", () => {
    const list = new TodoList();
    list.add("first");
    list.add("second");

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["first", "second"]);
  });

  it("can be asked for on any filter", () => {
    const list = new TodoList();
    const milk = list.add("buy milk", new Date("2026-03-01"));
    list.add("buy bread", new Date("2026-01-01"));
    list.complete(milk.id);

    expect(list.list("completed", "due-date").map((todo) => todo.title)).toEqual(["buy milk"]);
    expect(list.list("open", "due-date").map((todo) => todo.title)).toEqual(["buy bread"]);
  });

  it("leaves a listing asked for with no order in the order todos were added", () => {
    const list = new TodoList();
    list.add("first", new Date("2026-03-01"));
    list.add("second", new Date("2026-01-01"));

    expect(list.list().map((todo) => todo.title)).toEqual(["first", "second"]);
  });
});

describe("listing overdue todos", () => {
  const now = new Date("2026-01-15T00:00:00Z");

  it("answers a dated, open todo due before now, not one due after", () => {
    const list = new TodoList(() => now);
    list.add("late", new Date("2026-01-01T00:00:00Z"));
    list.add("future", new Date("2026-02-01T00:00:00Z"));

    expect(list.overdue().map((todo) => todo.title)).toEqual(["late"]);
  });

  it("does not count a todo due exactly at now as overdue", () => {
    const list = new TodoList(() => now);
    list.add("on time", new Date(now.getTime()));

    expect(list.overdue()).toEqual([]);
  });

  it("does not count a completed todo as overdue, however long past its due date", () => {
    const list = new TodoList(() => now);
    const added = list.add("long overdue", new Date("2000-01-01T00:00:00Z"));
    list.complete(added.id);

    expect(list.overdue()).toEqual([]);
  });

  it("does not count an undated todo as overdue", () => {
    const list = new TodoList(() => now);
    list.add("someday");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const list = new TodoList(() => now);
    list.add("first", new Date("2000-01-01T00:00:00Z"));
    list.add("not overdue", new Date("2026-02-01T00:00:00Z"));
    list.add("second", new Date("2010-01-01T00:00:00Z"));

    expect(list.overdue().map((todo) => todo.title)).toEqual(["first", "second"]);
  });

  it("works without an injected clock", () => {
    const list = new TodoList();
    list.add("someday");

    expect(list.overdue()).toEqual([]);
  });
});
