---
name: angular
description: TypeScript-based web application framework by Google
category: web-development
---

# Angular

## What I Do

Angular is a TypeScript-based web application framework developed by Google. I provide a complete solution for building large-scale, enterprise applications with a powerful opinionated structure. My architecture enforces patterns like dependency injection, modular design, and strict typing, making me ideal for teams building complex applications that require maintainability at scale.

I excel at building enterprise applications, progressive web apps, and complex single-page applications. My comprehensive toolchain includes Angular CLI for project generation, RxJS for reactive programming, and Angular Universal for server-side rendering. TypeScript integration provides excellent developer experience with IDE support and compile-time type checking.

## When to Use Me

Choose Angular when building enterprise applications requiring strict architecture, long-term maintainability, and team scalability. I work well for applications needing built-in routing, HTTP client, and form handling without third-party dependencies. Angular is ideal for teams preferring convention over configuration and comprehensive documentation. Avoid Angular for simple websites or prototypes where a lighter framework would be faster to develop with, or when bundle size is a primary concern.

## Core Concepts

Angular applications are built with components, which are TypeScript classes decorated with @Component metadata specifying templates and styles. Dependency injection is a first-class citizen, allowing services to be injected into components and other services. Modules organize the application into cohesive feature sets, with the root module bootstrapping the application. The component tree creates a hierarchical structure with unidirectional data flow.

RxJS observables handle asynchronous operations and event streams, enabling powerful composition of asynchronous logic. Angular's change detection tracks changes in application state and updates the DOM accordingly. Pipes transform values in templates, and directives extend HTML with custom behavior. Angular Router handles navigation with lazy-loaded modules for code splitting.

## Code Examples

```typescript
import { Component, Inject, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

interface User {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-card" [class.selected]="isSelected">
      <div class="avatar">{{ getInitials(user) }}</div>
      <div class="info">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
      </div>
      <button (click)="onSelect()">Select</button>
    </div>
  `,
  styles: [`
    .user-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
    .user-card.selected {
      border-color: #1976d2;
      background: #e3f2fd;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 1rem;
    }
  `]
})
export class UserCardComponent implements OnInit, OnDestroy {
  @Input() user!: User;
  @Input() isSelected = false;
  @Output() select = new EventEmitter<User>();
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    console.log('User card initialized:', this.user.id);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  getInitials(user: User): string {
    return user.name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }
  
  onSelect(): void {
    this.select.emit(this.user);
    this.router.navigate(['/users', this.user.id], {
      relativeTo: this.route
    });
  }
}
```

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserCardComponent } from './user-card.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UserCardComponent],
  template: `
    <div class="user-list-container">
      <form [formGroup]="searchForm" class="search-form">
        <input 
          formControlName="search" 
          placeholder="Search users..."
          type="search"
        />
      </form>
      
      <div class="loading" *ngIf="loading">
        <span>Loading users...</span>
      </div>
      
      <div class="error" *ngIf="error">
        {{ error }}
      </div>
      
      <div class="users" *ngIf="!loading && !error">
        <app-user-card
          *ngFor="let user of filteredUsers"
          [user]="user"
          [isSelected]="selectedId === user.id"
          (select)="onUserSelect($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .search-form input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .users {
      display: grid;
      gap: 1rem;
    }
  `]
})
export class UserListComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  
  users: User[] = [];
  loading = false;
  error = '';
  selectedId: string | null = null;
  
  searchForm = this.fb.group({
    search: ['', Validators.minLength(2)]
  });
  
  get filteredUsers(): User[] {
    const searchTerm = this.searchForm.value.search?.toLowerCase() || '';
    return this.users.filter(user =>
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );
  }
  
  loadUsers(): void {
    this.loading = true;
    this.error = '';
    
    this.http.get<User[]>('/api/users')
      .subscribe({
        next: (users) => {
          this.users = users;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load users';
          this.loading = false;
          console.error(err);
        }
      });
  }
  
  onUserSelect(user: User): void {
    this.selectedId = user.id;
    console.log('Selected user:', user);
  }
}
```

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, of } from 'rxjs';

interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = '/api/users';
  
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();
  
  loadUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(this.handleError<User[]>('loadUsers', []))
    );
  }
  
  getUser(id: string): Observable<User | undefined> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<User | undefined>('getUser', undefined))
    );
  }
  
  private handleError<T>(operation: string, result: T): (error: Error) => Observable<T> {
    return (error: Error): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result);
    };
  }
}
```

## Best Practices

Use standalone components to reduce module boilerplate and improve tree-shaking. Implement proper change detection strategies, using OnPush for better performance in most scenarios. Use RxJS operators for async operations, avoiding nested subscriptions with subscribe in subscribe patterns. Implement proper error handling in services and components with catchError operators.

Use lazy loading for feature modules to reduce initial bundle size. Implement route guards for authentication and authorization checks. Write unit tests with Jest or Jasmine, testing components in isolation with TestBed. Use Angular DevTools for debugging and performance profiling. Follow naming conventions for components, services, and files.

## Common Patterns

The smart/dumb component pattern separates presentation logic from business logic, with container components managing state and presentation components rendering UI. The facade pattern provides a simplified API over complex subsystems, hiding implementation details. The resolver pattern pre-fetches data before route activation, ensuring components have required data.

The interceptor pattern handles HTTP requests and responses centrally for authentication, logging, and error handling. The dependency injection pattern provides services throughout the application with proper scoping. The reactive pattern uses RxJS observables for all data streams, enabling reactive programming throughout the application.
