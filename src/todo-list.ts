import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/** What order a listing comes back in. */
export type ListOrder = "insertion" | "due-date";

/** Where the list reads "now" from. A list built with none reads the real clock. */
export type Clock = () => Date;

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the list's order: `list` and `overdue` return todos in
 * the order they were added, and adding never reorders what is already there.
 * `overdue` measures each call against the clock's current now.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();

  constructor(private readonly clock: Clock = () => new Date()) {}

  /**
   * Add a todo with the given title, and answer the todo that was added.
   *
   * A due date is optional; a todo added without one is undated.
   */
  add(title: string, dueDate?: Date): Todo {
    const acceptedTitle = requireTitle(title);
    const acceptedDueDate = requireUsableDueDate(dueDate);
    const todo: Todo = {
      id: this.mintId(),
      title: acceptedTitle,
      completed: false,
      dueDate: acceptedDueDate,
    };
    this.todos.set(todo.id, todo);
    return cloneTodo(todo);
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return cloneTodo(todo);
  }

  rename(id: TodoId, title: string): Todo {
    return this.replace({ ...this.get(id), title: requireTitle(title) });
  }

  complete(id: TodoId): Todo {
    return this.replace({ ...this.get(id), completed: true });
  }

  reopen(id: TodoId): Todo {
    return this.replace({ ...this.get(id), completed: false });
  }

  remove(id: TodoId): void {
    if (!this.todos.delete(id)) throw unknownTodo(id);
  }

  /**
   * The todos the filter asks for, in the order asked for.
   *
   * Asked for with no order, they come back in the order they were added.
   * Asked for in due-date order, the soonest due date comes first and every
   * undated todo comes after every dated one, stable within equal due dates
   * and among the undated todos themselves.
   */
  list(filter: TodoFilter = "all", order: ListOrder = "insertion"): Todo[] {
    const todos = this.selectTodos((todo) => matches(todo, filter));
    return order === "due-date" ? todos.sort(compareByDueDate) : todos;
  }

  /** The todos that are overdue, in the order they were added. */
  overdue(): Todo[] {
    const now = this.clock();
    return this.selectTodos((todo) => isOverdue(todo, now));
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return cloneTodo(todo);
  }

  private selectTodos(predicate: (todo: Todo) => boolean): Todo[] {
    return [...this.todos.values()].filter(predicate).map(cloneTodo);
  }

  /** The next unused id. Only a todo that is about to be added takes one. */
  private mintId(): TodoId {
    return String(this.todos.size + 1);
  }
}

function requireTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed === "") throw new InvalidTitleError("A todo needs a title with something in it.");
  return trimmed;
}

function requireUsableDueDate(dueDate: Date | undefined): Date | undefined {
  if (dueDate === undefined) return undefined;
  if (Number.isNaN(dueDate.getTime())) {
    throw new InvalidDueDateError("A due date needs to be a usable point in time.");
  }
  return new Date(dueDate.getTime());
}

function cloneTodo(todo: Todo): Todo {
  return { ...todo, dueDate: todo.dueDate === undefined ? undefined : new Date(todo.dueDate.getTime()) };
}

function unknownTodo(id: TodoId): UnknownTodoError {
  return new UnknownTodoError(`This list holds no todo with id ${id}.`);
}

function matches(todo: Todo, filter: TodoFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return !todo.completed;
  return todo.completed;
}

function compareByDueDate(a: Todo, b: Todo): number {
  if (a.dueDate === undefined) return b.dueDate === undefined ? 0 : 1;
  if (b.dueDate === undefined) return -1;
  return a.dueDate.getTime() - b.dueDate.getTime();
}

function isOverdue(todo: Todo, now: Date): boolean {
  if (todo.dueDate === undefined) return false;
  if (todo.completed) return false;
  return todo.dueDate.getTime() < now.getTime();
}
