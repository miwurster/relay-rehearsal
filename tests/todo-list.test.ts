import { describe, expect, it } from "vitest";

import { InvalidTitleError, TodoList, UnknownTodoError } from "../src/index.js";

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

describe("searching todos", () => {
  it("answers the todos whose title contains the text", () => {
    const list = new TodoList();
    const milk = list.add("buy milk");
    list.add("buy bread");

    expect(list.search("milk").map((todo) => todo.title)).toEqual([milk.title]);
  });

  it("matches text found anywhere in the title, not only at the start", () => {
    const list = new TodoList();
    list.add("spread milk today");

    expect(list.search("milk")).toHaveLength(1);
  });

  it("ignores case when matching", () => {
    const list = new TodoList();
    list.add("Buy Milk");

    expect(list.search("milk")).toHaveLength(1);
  });

  it("trims the text searched for", () => {
    const list = new TodoList();
    list.add("buy milk");

    expect(list.search("  milk  ")).toHaveLength(1);
  });

  it("matches nothing when the text is empty once trimmed", () => {
    const list = new TodoList();
    list.add("buy milk");

    expect(list.search("   ")).toEqual([]);
  });

  it("answers an empty listing when nothing matches", () => {
    const list = new TodoList();
    list.add("buy milk");

    expect(list.search("bread")).toEqual([]);
  });

  it("searches within the open todos when composed with the open filter", () => {
    const list = new TodoList();
    const milk = list.add("buy milk");
    list.add("buy oat milk");
    list.complete(milk.id);

    expect(list.search("milk", "open").map((todo) => todo.title)).toEqual(["buy oat milk"]);
  });

  it("searches within the completed todos when composed with the completed filter", () => {
    const list = new TodoList();
    const milk = list.add("buy milk");
    list.add("buy oat milk");
    list.complete(milk.id);

    expect(list.search("milk", "completed").map((todo) => todo.title)).toEqual(["buy milk"]);
  });

  it("answers matches in the order they were added", () => {
    const list = new TodoList();
    list.add("buy milk");
    list.add("buy bread");
    list.add("buy oat milk");

    expect(list.search("milk").map((todo) => todo.title)).toEqual(["buy milk", "buy oat milk"]);
  });

  it("answers a listing that a later add does not reach", () => {
    const list = new TodoList();
    list.add("buy milk");

    const listing = list.search("milk");
    list.add("buy more milk");

    expect(listing).toHaveLength(1);
  });
});
