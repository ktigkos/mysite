import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'missing';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  form: FormGroup;
  status: Status = 'idle';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(1)]],
      last_name:  ['', [Validators.required, Validators.minLength(1)]],
      phone:      ['', [Validators.required, Validators.pattern(/^[\d\s\+\-\(\)]{6,}$/)]],
    });
  }

  get f() { return this.form.controls; }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.status = 'missing';
      return;
    }
    this.status = 'loading';
    this.http.post<{ success: boolean }>('/api/contacts', this.form.value)
      .subscribe({
        next: () => {
          this.status = 'success';
          this.form.reset();
          setTimeout(() => this.status = 'idle', 5000);
        },
        error: (err) => {
          this.status = err.status === 422 ? 'missing' : 'error';
          setTimeout(() => this.status = 'idle', 5000);
        }
      });
  }

  fieldError(name: string): boolean {
    const c = this.form.get(name);
    return !!(c && c.invalid && c.touched);
  }
}
