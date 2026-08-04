import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/** What order a listing comes back in. */
export type TodoOrder = "insertion" | "dueDate";

/** Where the list reads "now" from. */
export type Clock = () => Date;

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is what `list` returns unless it is asked for another
 * order, and adding never reorders what is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();
  private readonly clock: Clock;

  constructor(clock: Clock = () => new Date()) {
    this.clock = clock;
  }

  /** Add a todo with the given title, and answer the todo that was added. */
  add(title: string, dueDate?: Date): Todo {
    const accepted = requireTitle(title);
    const acceptedDueDate = requireUsableDueDate(dueDate);
    const todo: Todo = { id: this.mintId(), title: accepted, completed: false, dueDate: acceptedDueDate };
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

  /** The todos the filter asks for, in the order asked for. */
  list(filter: TodoFilter = "all", order: TodoOrder = "insertion"): Todo[] {
    const filtered = [...this.todos.values()].filter((todo) => matches(todo, filter));
    if (order === "dueDate") filtered.sort(compareByDueDate);
    return filtered.map(cloneTodo);
  }

  /** The dated, open todos due before now, in the order they were added. */
  overdue(): Todo[] {
    const now = this.clock();
    return this.list("open").filter((todo) => todo.dueDate !== undefined && todo.dueDate.getTime() < now.getTime());
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return cloneTodo(todo);
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

/** A copy of the todo, its due date cloned so mutating either leaves the other be. */
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

/** Soonest due date first; a todo with no due date sorts after every dated one. */
function compareByDueDate(a: Todo, b: Todo): number {
  if (a.dueDate === undefined) return b.dueDate === undefined ? 0 : 1;
  if (b.dueDate === undefined) return -1;
  return a.dueDate.getTime() - b.dueDate.getTime();
}
