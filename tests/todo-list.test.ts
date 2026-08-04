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
    const dueDate = new Date("2026-08-10");

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
    const yesterday = new Date("2000-01-01");

    const todo = list.add("buy milk", yesterday);

    expect(todo.dueDate).toEqual(yesterday);
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

  it("leaves its due date as it was", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
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

  it("leaves the due date as it was through completing and reopening", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
    const added = list.add("buy milk", dueDate);

    const completed = list.complete(added.id);
    const reopened = list.reopen(added.id);

    expect(completed.dueDate).toEqual(dueDate);
    expect(reopened.dueDate).toEqual(dueDate);
  });

  it("does not change the due date of a todo handed out earlier", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
    const added = list.add("buy milk", dueDate);

    list.complete(added.id);
    list.rename(added.id, "buy oat milk");

    expect(added.dueDate).toEqual(dueDate);
  });

  it("does not let a caller mutating their own due date change the stored todo", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-10");
    const original = new Date(dueDate.getTime());

    const added = list.add("buy milk", dueDate);
    dueDate.setFullYear(2099);

    expect(added.dueDate).toEqual(original);
    expect(list.get(added.id).dueDate).toEqual(original);
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
  it("answers dated todos soonest due date first, whatever order they were added in", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-08-20"));
    const soonest = list.add("soonest", new Date("2026-08-01"));
    const middle = list.add("middle", new Date("2026-08-10"));

    expect(list.list("all", "dueDate").map((todo) => todo.id)).toEqual([soonest.id, middle.id, later.id]);
  });

  it("answers every undated todo after every dated one", () => {
    const list = new TodoList();
    const undated = list.add("undated");
    const dated = list.add("dated", new Date("2026-08-01"));

    expect(list.list("all", "dueDate").map((todo) => todo.id)).toEqual([dated.id, undated.id]);
  });

  it("keeps the order they were added in among todos sharing a due date, and among the undated ones", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-01");
    const firstDated = list.add("first dated", dueDate);
    const firstUndated = list.add("first undated");
    const secondDated = list.add("second dated", dueDate);
    const secondUndated = list.add("second undated");

    expect(list.list("all", "dueDate").map((todo) => todo.id)).toEqual([
      firstDated.id,
      secondDated.id,
      firstUndated.id,
      secondUndated.id,
    ]);
  });

  it("orders the open filter by due date too", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-08-20"));
    const soonest = list.add("soonest", new Date("2026-08-01"));
    list.complete(list.add("completed", new Date("2026-08-01")).id);

    expect(list.list("open", "dueDate").map((todo) => todo.id)).toEqual([soonest.id, later.id]);
  });

  it("orders the completed filter by due date too", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-08-20"));
    const soonest = list.add("soonest", new Date("2026-08-01"));
    list.add("open", new Date("2026-08-01"));
    list.complete(later.id);
    list.complete(soonest.id);

    expect(list.list("completed", "dueDate").map((todo) => todo.id)).toEqual([soonest.id, later.id]);
  });

  it("leaves a listing asked for with no order in the order todos were added", () => {
    const list = new TodoList();
    const later = list.add("later", new Date("2026-08-20"));
    const soonest = list.add("soonest", new Date("2026-08-01"));

    expect(list.list().map((todo) => todo.id)).toEqual([later.id, soonest.id]);
  });
});

describe("listing overdue todos", () => {
  it("answers a dated, open todo due before the supplied now", () => {
    const now = new Date("2026-08-10");
    const list = new TodoList(() => now);
    const overdue = list.add("buy milk", new Date("2026-08-09"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([overdue.id]);
  });

  it("does not answer a dated todo due after the supplied now", () => {
    const now = new Date("2026-08-10");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date("2026-08-11"));

    expect(list.overdue()).toEqual([]);
  });

  it("does not answer a todo due exactly at the supplied now", () => {
    const now = new Date("2026-08-10");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date(now.getTime()));

    expect(list.overdue()).toEqual([]);
  });

  it("does not answer a completed todo with a long-past due date", () => {
    const now = new Date("2026-08-10");
    const list = new TodoList(() => now);
    const completed = list.add("buy milk", new Date("2000-01-01"));
    list.complete(completed.id);

    expect(list.overdue()).toEqual([]);
  });

  it("does not answer an undated todo", () => {
    const now = new Date("2026-08-10");
    const list = new TodoList(() => now);
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const now = new Date("2026-08-10");
    const list = new TodoList(() => now);
    const first = list.add("first", new Date("2026-08-01"));
    list.add("undated");
    const second = list.add("second", new Date("2026-08-02"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([first.id, second.id]);
  });

  it("measures against the real clock when none is supplied", () => {
    const list = new TodoList();
    const overdue = list.add("buy milk", new Date("2000-01-01"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([overdue.id]);
  });
});
