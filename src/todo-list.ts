import type { Clock } from "./clock.js";
import { systemClock } from "./clock.js";
import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/** What order a listing comes back in. */
export type TodoOrder = "insertion" | "due-date";

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the default: `list` returns todos in the order they
 * were added unless due-date order is asked for, and adding never reorders
 * what is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();

  constructor(private readonly clock: Clock = systemClock) {}

  /** Add a todo with the given title and optional due date, and answer the todo that was added. */
  add(title: string, dueDate?: Date): Todo {
    const accepted = requireTitle(title);
    const acceptedDueDate = requireUsableDueDate(dueDate);
    const todo: Todo = { id: this.mintId(), title: accepted, completed: false, dueDate: acceptedDueDate };
    this.todos.set(todo.id, todo);
    return cloneTodo(todo);
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    return cloneTodo(this.find(id));
  }

  rename(id: TodoId, title: string): Todo {
    return this.replace({ ...this.find(id), title: requireTitle(title) });
  }

  complete(id: TodoId): Todo {
    return this.replace({ ...this.find(id), completed: true });
  }

  reopen(id: TodoId): Todo {
    return this.replace({ ...this.find(id), completed: false });
  }

  remove(id: TodoId): void {
    if (!this.todos.delete(id)) throw unknownTodo(id);
  }

  /** The todos the filter asks for, in the order they were added, or in due-date order if asked. */
  list(filter: TodoFilter = "all", order: TodoOrder = "insertion"): Todo[] {
    const matched = this.collect((todo) => matches(todo, filter));
    return order === "due-date" ? sortByDueDate(matched) : matched;
  }

  /** The dated, open todos due before now, in the order they were added. */
  overdue(): Todo[] {
    const now = this.clock.now();
    return this.collect((todo) => isOverdue(todo, now));
  }

  private find(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return todo;
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return cloneTodo(todo);
  }

  /** The todos matching `keep`, in the order they were added, cloned on the way out. */
  private collect(keep: (todo: Todo) => boolean): Todo[] {
    return [...this.todos.values()].filter(keep).map(cloneTodo);
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

function requireUsableDueDate(dueDate: Date | undefined): Date | null {
  if (dueDate === undefined) return null;
  if (Number.isNaN(dueDate.getTime())) {
    throw new InvalidDueDateError("A due date needs to be a usable point in time.");
  }
  return new Date(dueDate.getTime());
}

function cloneTodo(todo: Todo): Todo {
  return { ...todo, dueDate: todo.dueDate === null ? null : new Date(todo.dueDate.getTime()) };
}

function unknownTodo(id: TodoId): UnknownTodoError {
  return new UnknownTodoError(`This list holds no todo with id ${id}.`);
}

/** `todos` sorted soonest due date first, stable within an equal due date. */
function sortByDueDate(todos: Todo[]): Todo[] {
  return [...todos].sort(compareByDueDate);
}

function compareByDueDate(left: Todo, right: Todo): number {
  if (left.dueDate === null && right.dueDate === null) return 0;
  if (left.dueDate === null) return 1;
  if (right.dueDate === null) return -1;
  return left.dueDate.getTime() - right.dueDate.getTime();
}

function matches(todo: Todo, filter: TodoFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return !todo.completed;
  return todo.completed;
}

function isOverdue(todo: Todo, now: Date): boolean {
  return !todo.completed && todo.dueDate !== null && todo.dueDate.getTime() < now.getTime();
}
