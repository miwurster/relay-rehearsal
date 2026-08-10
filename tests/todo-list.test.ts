import { describe, expect, it } from "vitest";

import { InvalidDueDateError, InvalidTitleError, TodoList, UnknownTodoError } from "../src/index.js";

describe("adding a todo", () => {
  it("adds it open, under a title trimmed of its whitespace", () => {
    const list = new TodoList();

    const todo = list.add("  buy milk  ");

    expect(todo.title).toBe("buy milk");
    expect(todo.completed).toBe(false);
  });

  it("carries the due date it was added with", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");

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
    const dueDate = new Date("2000-01-01");

    const todo = list.add("buy milk", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("refuses a due date that is not a usable point in time", () => {
    const list = new TodoList();

    expect(() => list.add("buy milk", new Date("not a date"))).toThrow(InvalidDueDateError);
    expect(list.list()).toHaveLength(0);
  });

  it("keeps its due date when the caller's own Date is mutated afterwards", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");

    const todo = list.add("buy milk", dueDate);
    dueDate.setFullYear(1999);

    expect(todo.dueDate).toEqual(new Date("2026-08-10"));
    expect(list.get(todo.id).dueDate).toEqual(new Date("2026-08-10"));
  });

  it("keeps its due date when the returned todo's Date is mutated", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");

    const todo = list.add("buy milk", dueDate);
    todo.dueDate?.setFullYear(1999);

    expect(list.get(todo.id).dueDate).toEqual(new Date("2026-08-10"));
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

  it("leaves its due date as it was added", () => {
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

  it("leaves the due date as it was added, through completing and reopening", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
    const added = list.add("buy milk", dueDate);

    const completed = list.complete(added.id);
    expect(completed.dueDate).toEqual(dueDate);

    const reopened = list.reopen(added.id);
    expect(reopened.dueDate).toEqual(dueDate);
  });

  it("does not change the due date of a todo handed out earlier", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
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

describe("listing todos in due-date order", () => {
  it("answers dated todos soonest first, whatever order they were added in", () => {
    const list = new TodoList();
    list.add("due last", new Date("2026-08-12"));
    list.add("due first", new Date("2026-08-10"));
    list.add("due second", new Date("2026-08-11"));

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual([
      "due first",
      "due second",
      "due last",
    ]);
  });

  it("answers every undated todo after every dated one", () => {
    const list = new TodoList();
    list.add("undated");
    list.add("dated", new Date("2026-08-10"));

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["dated", "undated"]);
  });

  it("keeps the order todos were added in among ones sharing a due date", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
    list.add("first", dueDate);
    list.add("second", dueDate);

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["first", "second"]);
  });

  it("keeps the order they were added in among the undated todos", () => {
    const list = new TodoList();
    list.add("first");
    list.add("second");

    expect(list.list("all", "due-date").map((todo) => todo.title)).toEqual(["first", "second"]);
  });

  it("can be asked for alongside the open filter", () => {
    const list = new TodoList();
    list.add("buy milk", new Date("2026-08-11"));
    list.add("buy bread", new Date("2026-08-10"));

    expect(list.list("open", "due-date").map((todo) => todo.title)).toEqual(["buy bread", "buy milk"]);
  });

  it("can be asked for alongside the completed filter", () => {
    const list = new TodoList();
    const milk = list.add("buy milk", new Date("2026-08-11"));
    const bread = list.add("buy bread", new Date("2026-08-10"));
    list.complete(milk.id);
    list.complete(bread.id);

    expect(list.list("completed", "due-date").map((todo) => todo.title)).toEqual(["buy bread", "buy milk"]);
  });

  it("leaves a listing asked for with no order in the order todos were added", () => {
    const list = new TodoList();
    list.add("due last", new Date("2026-08-12"));
    list.add("due first", new Date("2026-08-10"));

    expect(list.list().map((todo) => todo.title)).toEqual(["due last", "due first"]);
  });
});

describe("listing overdue todos", () => {
  it("holds a dated, open todo due before the injected clock's now", () => {
    const list = new TodoList(() => new Date("2026-08-10"));
    const milk = list.add("buy milk", new Date("2026-08-09"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([milk.id]);
  });

  it("does not hold a dated, open todo due after the injected clock's now", () => {
    const list = new TodoList(() => new Date("2026-08-10"));
    list.add("buy milk", new Date("2026-08-11"));

    expect(list.overdue()).toEqual([]);
  });

  it("does not hold a todo due exactly at the injected clock's now", () => {
    const now = new Date("2026-08-10");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date("2026-08-10"));

    expect(list.overdue()).toEqual([]);
  });

  it("does not hold a completed todo with a long-past due date", () => {
    const list = new TodoList(() => new Date("2026-08-10"));
    const milk = list.add("buy milk", new Date("2000-01-01"));
    list.complete(milk.id);

    expect(list.overdue()).toEqual([]);
  });

  it("does not hold an undated todo", () => {
    const list = new TodoList(() => new Date("2026-08-10"));
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const list = new TodoList(() => new Date("2026-08-10"));
    const bread = list.add("buy bread", new Date("2001-01-01"));
    list.add("buy milk", new Date("2026-08-11"));
    const eggs = list.add("buy eggs", new Date("2000-01-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([bread.id, eggs.id]);
  });

  it("measures against the real clock when constructed with no clock", () => {
    const list = new TodoList();
    list.add("buy milk", new Date("2000-01-01"));

    expect(list.overdue()).toHaveLength(1);
  });
});
