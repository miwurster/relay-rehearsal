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
    const dueDate = new Date("2026-01-01");

    const todo = list.add("buy milk", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("keeps its due date when the caller's Date is later mutated", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");

    const todo = list.add("buy milk", dueDate);
    dueDate.setFullYear(2099);

    expect(todo.dueDate).toEqual(new Date("2026-01-01"));
  });

  it("keeps its due date when a due date handed back is mutated", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const added = list.add("buy milk", dueDate);

    added.dueDate!.setFullYear(2099);

    expect(list.get(added.id).dueDate).toEqual(new Date("2026-01-01"));
  });

  it("is undated when added without a due date", () => {
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

  it("leaves the due date it was added with when completed", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const added = list.add("buy milk", dueDate);

    expect(list.complete(added.id).dueDate).toEqual(dueDate);
  });

  it("leaves the due date it was added with when reopened", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-01-01");
    const added = list.add("buy milk", dueDate);
    list.complete(added.id);

    expect(list.reopen(added.id).dueDate).toEqual(dueDate);
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

  it("does not give the todo handed out earlier a due date", () => {
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

describe("listing overdue todos", () => {
  it("includes a dated, open todo due before the supplied now, and excludes one due after it", () => {
    const now = new Date("2026-06-15");
    const list = new TodoList({ now: () => now });
    const late = list.add("renew passport", new Date("2026-06-01"));
    list.add("plan trip", new Date("2026-07-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([late.id]);
  });

  it("excludes a todo due exactly at the supplied now", () => {
    const now = new Date("2026-06-15");
    const list = new TodoList({ now: () => now });
    list.add("renew passport", now);

    expect(list.overdue()).toEqual([]);
  });

  it("excludes a completed todo with a long-past due date", () => {
    const now = new Date("2026-06-15");
    const list = new TodoList({ now: () => now });
    const milk = list.add("buy milk", new Date("2000-01-01"));
    list.complete(milk.id);

    expect(list.overdue()).toEqual([]);
  });

  it("excludes an undated todo", () => {
    const now = new Date("2026-06-15");
    const list = new TodoList({ now: () => now });
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const now = new Date("2026-06-15");
    const list = new TodoList({ now: () => now });
    list.add("a", new Date("2026-02-01"));
    list.add("b", new Date("2026-01-01"));

    expect(list.overdue().map((todo) => todo.title)).toEqual(["a", "b"]);
  });

  it("measures a list constructed with no clock against the real clock", () => {
    const list = new TodoList();
    const overdueTodo = list.add("renew passport", new Date("2000-01-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([overdueTodo.id]);
  });
});
