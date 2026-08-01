import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the list's order: `list` returns todos in the order they
 * were added, and adding never reorders what is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();

  /** Add a todo with the given title and an optional due date, and answer the todo that was added. */
  add(title: string, dueDate: Date | null = null): Todo {
    const acceptedTitle = requireTitle(title);
    const acceptedDueDate = requireDueDate(dueDate);
    const todo: Todo = { id: this.mintId(), title: acceptedTitle, completed: false, dueDate: acceptedDueDate };
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

  /** The todos the filter asks for, in the order they were added. */
  list(filter: TodoFilter = "all"): Todo[] {
    return [...this.todos.values()].filter((todo) => matches(todo, filter)).map(cloneTodo);
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

function requireDueDate(dueDate: Date | null): Date | null {
  if (dueDate === null) return null;
  if (Number.isNaN(dueDate.getTime())) {
    throw new InvalidDueDateError("A due date needs to be a usable point in time.");
  }
  return cloneDueDate(dueDate);
}

/** A copy of the todo, holding its own due date, so no one can mutate a date the list still holds. */
function cloneTodo(todo: Todo): Todo {
  return { ...todo, dueDate: cloneDueDate(todo.dueDate) };
}

function cloneDueDate(dueDate: Date | null): Date | null {
  return dueDate === null ? null : new Date(dueDate.getTime());
}

function unknownTodo(id: TodoId): UnknownTodoError {
  return new UnknownTodoError(`This list holds no todo with id ${id}.`);
}

function matches(todo: Todo, filter: TodoFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return !todo.completed;
  return todo.completed;
}
