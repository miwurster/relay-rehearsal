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
  it("comes back carrying the due date it was added with", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-01-01");

    const todo = list.add("buy milk", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("comes back undated when added without one", () => {
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

  it("does not gain or change a due date when the caller's Date is mutated afterwards", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-01-01");

    const todo = list.add("buy milk", dueDate);
    dueDate.setFullYear(2030);

    expect(todo.dueDate).toEqual(new Date("2024-01-01"));
    expect(list.get(todo.id).dueDate).toEqual(new Date("2024-01-01"));
  });

  it("does not gain or change a due date when a todo handed back out is mutated", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-01-01");
    const added = list.add("buy milk", dueDate);

    added.dueDate!.setFullYear(2030);
    list.get(added.id).dueDate!.setFullYear(1999);

    expect(list.get(added.id).dueDate).toEqual(new Date("2024-01-01"));
    expect(list.list().map((todo) => todo.dueDate)).toEqual([new Date("2024-01-01")]);
  });

  it("stays undated through renaming, completing and reopening", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    list.rename(added.id, "buy oat milk");
    list.complete(added.id);
    list.reopen(added.id);

    expect(added.dueDate).toBeUndefined();
    expect(list.get(added.id).dueDate).toBeUndefined();
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
    const dueDate = new Date("2024-01-01");
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

  it("leaves the due date it was added with as it was when completed and reopened", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-01-01");
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
  it("orders dated todos soonest due date first, whatever order they were added in", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2024-06-20"));
    const soonest = list.add("soonest", new Date("2024-06-10"));
    const middle = list.add("middle", new Date("2024-06-15"));

    expect(list.list("all", "due-date").map((todo) => todo.id)).toEqual([soonest.id, middle.id, later.id]);
  });

  it("puts every undated todo after every dated one", () => {
    const list = new TodoList();
    const undated = list.add("undated");
    const dated = list.add("dated", new Date("2024-06-10"));

    expect(list.list("all", "due-date").map((todo) => todo.id)).toEqual([dated.id, undated.id]);
  });

  it("keeps insertion order between todos sharing a due date", () => {
    const list = new TodoList();
    const dueDate = new Date("2024-06-10");
    const first = list.add("first", dueDate);
    const second = list.add("second", dueDate);

    expect(list.list("all", "due-date").map((todo) => todo.id)).toEqual([first.id, second.id]);
  });

  it("keeps insertion order between undated todos", () => {
    const list = new TodoList();
    const first = list.add("first");
    const second = list.add("second");

    expect(list.list("all", "due-date").map((todo) => todo.id)).toEqual([first.id, second.id]);
  });

  it("orders within a filter, without changing which todos it holds", () => {
    const list = new TodoList();
    const milk = list.add("buy milk", new Date("2024-06-20"));
    const bread = list.add("buy bread", new Date("2024-06-10"));
    const eggs = list.add("buy eggs", new Date("2024-06-15"));
    list.complete(eggs.id);

    expect(list.list("open", "due-date").map((todo) => todo.id)).toEqual([bread.id, milk.id]);
  });

  it("orders a completed filter in due-date order too", () => {
    const list = new TodoList();
    const milk = list.add("buy milk", new Date("2024-06-20"));
    const bread = list.add("buy bread", new Date("2024-06-10"));
    list.complete(milk.id);
    list.complete(bread.id);

    expect(list.list("completed", "due-date").map((todo) => todo.id)).toEqual([bread.id, milk.id]);
  });

  it("answers todos in the order they were added when no order is asked for", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2024-06-20"));
    const soonest = list.add("soonest", new Date("2024-06-10"));

    expect(list.list().map((todo) => todo.id)).toEqual([later.id, soonest.id]);
  });
});

describe("listing overdue todos", () => {
  it("holds a dated, open todo due before the clock's now", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    const overdue = list.add("buy milk", new Date("2024-06-14"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([overdue.id]);
  });

  it("does not hold a dated, open todo due after the clock's now", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date("2024-06-16"));

    expect(list.overdue()).toEqual([]);
  });

  it("does not hold a todo due exactly at the clock's now", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    list.add("buy milk", now);

    expect(list.overdue()).toEqual([]);
  });

  it("does not hold a completed todo with a long-past due date", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    const milk = list.add("buy milk", new Date("2000-01-01"));
    list.complete(milk.id);

    expect(list.overdue()).toEqual([]);
  });

  it("does not hold an undated todo", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    const first = list.add("first", new Date("2024-06-01"));
    list.add("undated");
    const third = list.add("third", new Date("2024-06-02"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([first.id, third.id]);
  });

  it("does not gain or change a due date when a todo handed back out by overdue is mutated", () => {
    const now = new Date("2024-06-15");
    const list = new TodoList(() => now);
    const overdue = list.add("buy milk", new Date("2024-06-14"));

    list.overdue().forEach((todo) => todo.dueDate!.setFullYear(1999));

    expect(list.get(overdue.id).dueDate).toEqual(new Date("2024-06-14"));
  });

  it("measures a list constructed with no clock against the real one", () => {
    const list = new TodoList();
    const overdue = list.add("buy milk", new Date(Date.now() - 1000));
    list.add("buy bread", new Date(Date.now() + 100_000));

    expect(list.overdue().map((todo) => todo.id)).toEqual([overdue.id]);
  });
});
