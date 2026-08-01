import { describe, expect, it } from "vitest";

import { InvalidDueDateError, InvalidTitleError, TodoList, UnknownTodoError } from "../src/index.js";
import type { Clock } from "../src/index.js";

function clockReading(now: Date): Clock {
  return { now: () => now };
}

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

  it("carries the due date it was given", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15");

    const todo = list.add("buy milk", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("is undated when added without a due date", () => {
    const list = new TodoList();

    const todo = list.add("buy milk");

    expect(todo.dueDate).toBeNull();
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

    expect(renamed).toEqual({ id: added.id, title: "buy oat milk", completed: true, dueDate: null });
  });

  it("refuses a title that is empty once trimmed", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    expect(() => list.rename(added.id, "")).toThrow(InvalidTitleError);
    expect(list.get(added.id).title).toBe("buy milk");
  });

  it("leaves its due date as it was", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15");
    const added = list.add("buy milk", dueDate);

    const renamed = list.rename(added.id, "buy oat milk");

    expect(renamed.dueDate).toEqual(dueDate);
  });

  it("leaves the due date of the todo handed out earlier unchanged", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15");
    const added = list.add("buy milk", dueDate);

    dueDate.setFullYear(1999);
    list.rename(added.id, "buy oat milk");

    expect(added.dueDate).toEqual(new Date("2026-08-15"));
    expect(list.get(added.id).dueDate).toEqual(new Date("2026-08-15"));
  });
});

describe("completing and reopening a todo", () => {
  it("completes an open todo", () => {
    const list = new TodoList();
    const added = list.add("buy milk");

    expect(list.complete(added.id).completed).toBe(true);
  });

  it("leaves the due date as it was when completed", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15");
    const added = list.add("buy milk", dueDate);

    expect(list.complete(added.id).dueDate).toEqual(dueDate);
  });

  it("leaves the due date as it was when reopened", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15");
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
  it("counts a dated, open todo due before now as overdue", () => {
    const now = new Date("2026-08-01");
    const list = new TodoList(clockReading(now));
    const todo = list.add("buy milk", new Date("2026-07-31"));

    expect(list.overdue().map((overdue) => overdue.id)).toEqual([todo.id]);
  });

  it("does not count a dated, open todo due after now as overdue", () => {
    const now = new Date("2026-08-01");
    const list = new TodoList(clockReading(now));
    list.add("buy milk", new Date("2026-08-02"));

    expect(list.overdue()).toEqual([]);
  });

  it("does not count a todo due exactly at now as overdue", () => {
    const now = new Date("2026-08-01");
    const list = new TodoList(clockReading(now));
    list.add("buy milk", new Date(now.getTime()));

    expect(list.overdue()).toEqual([]);
  });

  it("does not count a completed todo as overdue, however long past its due date", () => {
    const now = new Date("2026-08-01");
    const list = new TodoList(clockReading(now));
    const todo = list.add("buy milk", new Date("2000-01-01"));
    list.complete(todo.id);

    expect(list.overdue()).toEqual([]);
  });

  it("does not count an undated todo as overdue", () => {
    const now = new Date("2026-08-01");
    const list = new TodoList(clockReading(now));
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added", () => {
    const now = new Date("2026-08-01");
    const list = new TodoList(clockReading(now));
    const first = list.add("first", new Date("2026-07-15"));
    list.add("undated");
    const third = list.add("third", new Date("2026-07-01"));

    expect(list.overdue().map((overdue) => overdue.id)).toEqual([first.id, third.id]);
  });

  it("does not let mutating a returned overdue todo affect the list", () => {
    const now = new Date("2026-08-01");
    const list = new TodoList(clockReading(now));
    const todo = list.add("buy milk", new Date("2026-07-31"));

    const overdue = list.overdue();
    expect(overdue).toHaveLength(1);
    overdue[0]?.dueDate?.setFullYear(2099);

    expect(list.overdue().map((stillOverdue) => stillOverdue.id)).toEqual([todo.id]);
  });

  it("reads the real clock when constructed with none", () => {
    const list = new TodoList();
    const overdue = list.add("overdue", new Date(Date.now() - 1000));
    list.add("not yet due", new Date(Date.now() + 86_400_000));

    expect(list.overdue().map((todo) => todo.id)).toEqual([overdue.id]);
  });
});
