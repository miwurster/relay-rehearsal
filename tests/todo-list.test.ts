import { describe, expect, it } from "vitest";

import { InvalidDueDateError, InvalidTitleError, TodoList, UnknownTodoError } from "../src/index.js";

describe("adding a todo", () => {
  it("adds it carrying the due date it was given", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15T00:00:00.000Z");

    const todo = list.add("buy milk", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("adds it undated when given no due date", () => {
    const list = new TodoList();

    const todo = list.add("buy milk");

    expect(todo.dueDate).toBeUndefined();
  });

  it("does not gain or change a due date when the caller's Date is mutated afterwards", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15T00:00:00.000Z");

    const todo = list.add("buy milk", dueDate);
    dueDate.setFullYear(1999);

    expect(todo.dueDate).toEqual(new Date("2026-08-15T00:00:00.000Z"));
    expect(list.get(todo.id).dueDate).toEqual(new Date("2026-08-15T00:00:00.000Z"));
  });

  it("accepts a due date that is already in the past", () => {
    const list = new TodoList();
    const pastDueDate = new Date("2000-01-01T00:00:00.000Z");

    const todo = list.add("buy milk", pastDueDate);

    expect(todo.dueDate).toEqual(pastDueDate);
  });

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

    expect(renamed).toEqual({ id: added.id, title: "buy oat milk", completed: true, dueDate: undefined });
  });

  it("leaves its due date as it was added", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15T00:00:00.000Z");
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

  it("leaves its due date as it was added when completed", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15T00:00:00.000Z");
    const added = list.add("buy milk", dueDate);

    expect(list.complete(added.id).dueDate).toEqual(dueDate);
  });

  it("reopens a completed todo", () => {
    const list = new TodoList();
    const added = list.add("buy milk");
    list.complete(added.id);

    expect(list.reopen(added.id).completed).toBe(false);
  });

  it("leaves its due date as it was added when reopened", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15T00:00:00.000Z");
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

  it("does not change the due date on a todo handed out earlier", () => {
    const list = new TodoList();
    const dueDate = new Date("2026-08-15T00:00:00.000Z");
    const added = list.add("buy milk", dueDate);

    list.complete(added.id);

    expect(added.dueDate).toEqual(dueDate);
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
    list.add("due last", new Date("2026-08-20T00:00:00.000Z"));
    list.add("due first", new Date("2026-08-01T00:00:00.000Z"));
    list.add("due second", new Date("2026-08-10T00:00:00.000Z"));

    const titles = list.list("all", "due-date").map((todo) => todo.title);

    expect(titles).toEqual(["due first", "due second", "due last"]);
  });

  it("answers every undated todo after every dated one", () => {
    const list = new TodoList();
    list.add("undated first");
    list.add("dated", new Date("2026-08-10T00:00:00.000Z"));
    list.add("undated second");

    const titles = list.list("all", "due-date").map((todo) => todo.title);

    expect(titles).toEqual(["dated", "undated first", "undated second"]);
  });

  it("keeps the order added for todos sharing a due date", () => {
    const list = new TodoList();
    const sharedDueDate = new Date("2026-08-10T00:00:00.000Z");
    list.add("dated, due last", new Date("2026-08-20T00:00:00.000Z"));
    list.add("shared due date, added first", sharedDueDate);
    list.add("shared due date, added second", sharedDueDate);
    list.add("undated first");
    list.add("undated second");

    const titles = list.list("all", "due-date").map((todo) => todo.title);

    expect(titles).toEqual([
      "shared due date, added first",
      "shared due date, added second",
      "dated, due last",
      "undated first",
      "undated second",
    ]);
  });

  it("keeps the order added among the undated todos", () => {
    const list = new TodoList();
    const sharedDueDate = new Date("2026-08-10T00:00:00.000Z");
    list.add("dated, due later", new Date("2026-08-20T00:00:00.000Z"));
    list.add("shared due date, added first", sharedDueDate);
    list.add("shared due date, added second", sharedDueDate);
    list.add("dated, due earlier", new Date("2026-08-01T00:00:00.000Z"));
    list.add("undated first");
    list.add("undated second");

    const titles = list.list("all", "due-date").map((todo) => todo.title);

    expect(titles).toEqual([
      "dated, due earlier",
      "shared due date, added first",
      "shared due date, added second",
      "dated, due later",
      "undated first",
      "undated second",
    ]);
  });

  it("applies to a filtered listing, not only to the unfiltered one", () => {
    const list = new TodoList();
    list.add("due last, open", new Date("2026-08-20T00:00:00.000Z"));
    const completed = list.add("due first, completed", new Date("2026-08-01T00:00:00.000Z"));
    list.add("due second, open", new Date("2026-08-10T00:00:00.000Z"));
    list.complete(completed.id);

    const titles = list.list("open", "due-date").map((todo) => todo.title);

    expect(titles).toEqual(["due second, open", "due last, open"]);
  });

  it("applies to a completed listing too", () => {
    const list = new TodoList();
    list.add("due last, open", new Date("2026-08-20T00:00:00.000Z"));
    const completedFirst = list.add("due first, completed", new Date("2026-08-01T00:00:00.000Z"));
    const completedSecond = list.add("due second, completed", new Date("2026-08-10T00:00:00.000Z"));
    list.complete(completedFirst.id);
    list.complete(completedSecond.id);

    const titles = list.list("completed", "due-date").map((todo) => todo.title);

    expect(titles).toEqual(["due first, completed", "due second, completed"]);
  });

  it("answers a listing asked for with no order in the order todos were added", () => {
    const list = new TodoList();
    list.add("due last", new Date("2026-08-20T00:00:00.000Z"));
    list.add("due first", new Date("2026-08-01T00:00:00.000Z"));

    const titles = list.list().map((todo) => todo.title);

    expect(titles).toEqual(["due last", "due first"]);
  });
});

describe("listing overdue todos", () => {
  it("includes a dated, open todo due before the supplied now", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const list = new TodoList(() => now);
    const todo = list.add("buy milk", new Date("2026-08-14T00:00:00.000Z"));

    expect(list.overdue().map((todo) => todo.id)).toEqual([todo.id]);
  });

  it("excludes a dated, open todo due after the supplied now", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date("2026-08-16T00:00:00.000Z"));

    expect(list.overdue()).toEqual([]);
  });

  it("excludes a todo due exactly at the supplied now", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const list = new TodoList(() => now);
    list.add("buy milk", new Date(now.getTime()));

    expect(list.overdue()).toEqual([]);
  });

  it("excludes a completed todo with a long-past due date", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const list = new TodoList(() => now);
    const todo = list.add("buy milk", new Date("2000-01-01T00:00:00.000Z"));
    list.complete(todo.id);

    expect(list.overdue()).toEqual([]);
  });

  it("excludes an undated todo", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const list = new TodoList(() => now);
    list.add("buy milk");

    expect(list.overdue()).toEqual([]);
  });

  it("answers overdue todos in the order they were added, not in due-date order", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const list = new TodoList(() => now);
    list.add("added first, due later", new Date("2026-08-02T00:00:00.000Z"));
    list.add("added second, due earlier", new Date("2026-08-01T00:00:00.000Z"));

    expect(list.overdue().map((todo) => todo.title)).toEqual(["added first, due later", "added second, due earlier"]);
  });

  it("measures a list constructed with no clock against the real one", () => {
    const list = new TodoList();
    const milk = list.add("buy milk", new Date(Date.now() - 1000));
    const bread = list.add("buy bread", new Date(Date.now() + 1000 * 60 * 60 * 24));

    const overdueIds = list.overdue().map((todo) => todo.id);

    expect(overdueIds).toEqual([milk.id]);
  });
});
