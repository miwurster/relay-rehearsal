import { describe, expect, it } from "vitest";

import { InvalidDueDateError, InvalidTitleError, TodoList, UnknownTodoError } from "../src/index.js";

describe("adding a todo", () => {
  it("adds it open, under a title trimmed of its whitespace", () => {
    const list = new TodoList();

    const todo = list.add("  buy milk  ");

    expect(todo.title).toBe("buy milk");
    expect(todo.completed).toBe(false);
  });

  it("adds it carrying the due date it was given", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-06-01");

    const todo = list.add("buy milk", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("adds it undated when no due date is given", () => {
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

  it("does not let the caller change a due date after handing it out", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-06-01");

    const todo = list.add("buy milk", dueDate);
    dueDate.setFullYear(2030);

    expect(todo.dueDate).toEqual(new Date("2024-06-01"));
  });

  it("does not let the caller change a due date by mutating a todo handed out earlier", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-06-01");
    const added = list.add("buy milk", dueDate);

    added.dueDate?.setFullYear(2030);

    expect(list.get(added.id).dueDate).toEqual(new Date("2024-06-01"));
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

  it("refuses a due date that is not a usable point in time", () => {
    const list = new TodoList();

    expect(() => list.add("buy milk", new Date("not a date"))).toThrow(InvalidDueDateError);
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

  it("refuses a title that is empty once trimmed", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    expect(() => list.rename(added.id, "")).toThrow(InvalidTitleError);
    expect(list.get(added.id).title).toBe("buy milk");
  });

  it("keeps its due date", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-06-01");
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

  it("keeps a due date through completing and reopening", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-06-01");
    const added = list.add("buy milk", dueDate);

    const completed = list.complete(added.id);
    const reopened = list.reopen(added.id);

    expect(completed.dueDate).toEqual(dueDate);
    expect(reopened.dueDate).toEqual(dueDate);
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
    list.add("later", new Date("2024-06-15"));
    list.add("soonest", new Date("2024-06-01"));
    list.add("middle", new Date("2024-06-08"));

    expect(list.list("all", "dueDate").map((todo) => todo.title)).toEqual(["soonest", "middle", "later"]);
  });

  it("answers every undated todo after every dated one", () => {
    const list = new TodoList();
    list.add("undated first");
    list.add("dated", new Date("2024-06-01"));
    list.add("undated second");

    expect(list.list("all", "dueDate").map((todo) => todo.title)).toEqual([
      "dated",
      "undated first",
      "undated second",
    ]);
  });

  it("keeps the order added among todos sharing a due date, and among the undated ones", () => {
    const list = new TodoList();
    const sameDueDate = new Date("2024-06-01");
    list.add("first dated", sameDueDate);
    list.add("first undated");
    list.add("second dated", sameDueDate);
    list.add("second undated");

    expect(list.list("all", "dueDate").map((todo) => todo.title)).toEqual([
      "first dated",
      "second dated",
      "first undated",
      "second undated",
    ]);
  });

  it("orders within a filter rather than replacing it", () => {
    const list = new TodoList();
    const milk = list.add("buy milk", new Date("2024-06-15"));
    list.add("buy bread", new Date("2024-06-01"));
    list.complete(milk.id);

    expect(list.list("completed", "dueDate").map((todo) => todo.title)).toEqual(["buy milk"]);
  });

  it("answers a listing asked for with no order in the order todos were added", () => {
    const list = new TodoList();
    list.add("later", new Date("2024-06-15"));
    list.add("soonest", new Date("2024-06-01"));

    expect(list.list().map((todo) => todo.title)).toEqual(["later", "soonest"]);
  });
});

describe("listing overdue todos", () => {
  it("answers a dated, open todo due before the clock's now", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    const milk = list.add("buy milk", new Date("2024-06-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([milk.id]);
  });

  it("does not answer a todo due after the clock's now", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date("2024-07-01"));

    expect(list.overdue()).toEqual([]);
  });

  it("does not answer a todo due exactly at the clock's now", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date(now.getTime()));

    expect(list.overdue()).toEqual([]);
  });

  it("does not answer a completed todo with a long-past due date", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    const milk = list.add("buy milk", new Date("2000-01-01"));
    list.complete(milk.id);

    expect(list.overdue()).toEqual([]);
  });

  it("does not answer an undated todo", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    const second = list.add("second", new Date("2024-06-02"));
    list.add("undated");
    const first = list.add("first", new Date("2024-06-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([second.id, first.id]);
  });

  it("measures a list constructed with no clock against the real clock", () => {
    const list = new TodoList();
    const overdue = list.add("buy milk", new Date(Date.now() - 1000));
    const notYetDue = list.add("buy bread", new Date(Date.now() + 1000 * 60 * 60));

    const ids = list.overdue().map((todo) => todo.id);

    expect(ids).toContain(overdue.id);
    expect(ids).not.toContain(notYetDue.id);
  });
});
