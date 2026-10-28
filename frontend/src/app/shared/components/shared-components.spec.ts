import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { AppShellComponent } from './app-shell/app-shell.component';
import { FormFieldComponent } from './form-field/form-field.component';
import { JarCardComponent } from './jar-card/jar-card.component';
import { MetricCardComponent } from './metric-card/metric-card.component';
import { MonthSelectorComponent } from './month-selector/month-selector.component';
import { PanelComponent } from './panel/panel.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { StatePanelComponent } from './state-panel/state-panel.component';
import { VndAmountInputComponent } from './vnd-amount-input/vnd-amount-input.component';
import { VndAmountPipe } from '../pipes/vnd-amount.pipe';

@Component({
  selector: 'test-vnd-amount-input-host',
  standalone: true,
  imports: [ReactiveFormsModule, VndAmountInputComponent],
  template: '<app-vnd-amount-input inputId="amount" [formControl]="amount" />'
})
class VndAmountInputHostComponent {
  readonly amount = new FormControl('1250', { nonNullable: true });
}

@Component({
  selector: 'test-jar-card-with-custom-icon',
  standalone: true,
  imports: [JarCardComponent],
  template: '<app-jar-card jarType="food" name="Food"><svg jar-icon data-test-icon="custom"></svg></app-jar-card>'
})
class JarCardWithCustomIconHostComponent {}

@Component({
  selector: 'test-jar-card-with-progress',
  standalone: true,
  imports: [JarCardComponent],
  template: `
    <app-jar-card jarType="food" name="Food" [percentage]="20" amountVnd="1250000" amountLabel="">
      <span jar-progress data-test-progress></span>
    </app-jar-card>
  `
})
class JarCardWithProgressHostComponent {}

describe('shared components', () => {
  it('renders the app shell navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const brand = fixture.nativeElement.querySelector('.ff-app-header__brand') as HTMLAnchorElement;
    const brandMark = brand.querySelector('.ff-app-header__mark') as HTMLElement;
    expect(brand.getAttribute('aria-label')).toBe('Family Finance home');
    expect(brandMark.getAttribute('aria-hidden')).toBe('true');
    expect(brandMark.querySelector('svg path')).not.toBeNull();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.ff-navigation__item')) as HTMLAnchorElement[];
    expect(links.map(link => link.textContent?.trim())).toEqual(['Home', 'Planning', 'Add Expense']);
    expect(links.every(link => link.querySelector('.ff-navigation__icon svg'))).toBe(true);
    const chevron = fixture.nativeElement.querySelector('.ff-family-identity__chevron') as SVGElement;
    expect(chevron.querySelector('path')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#ff-main-content')).not.toBeNull();
  });

  it('renders an optional header context without changing the default shell', async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('headerContext', 'Expenses');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ff-app-header__context')?.textContent?.trim()).toBe('Expenses');
  });

  it('renders an optional panel eyebrow above its title', async () => {
    await TestBed.configureTestingModule({ imports: [PanelComponent] }).compileComponents();

    const fixture = TestBed.createComponent(PanelComponent);
    fixture.componentRef.setInput('title', 'Your default allocation');
    fixture.componentRef.setInput('eyebrow', 'Fixed allocation');
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.ff-panel') as HTMLElement;
    const header = fixture.nativeElement.querySelector('.ff-panel__header') as HTMLElement;
    expect(header.querySelector('.ff-panel__eyebrow')?.textContent?.trim()).toBe('Fixed allocation');
    expect(header.querySelector('h2')?.textContent?.trim()).toBe('Your default allocation');
    expect(panel.getAttribute('aria-label')).toBe('Your default allocation');
  });

  it('emits the selected period from the month selector', async () => {
    await TestBed.configureTestingModule({ imports: [MonthSelectorComponent] }).compileComponents();

    const fixture = TestBed.createComponent(MonthSelectorComponent);
    fixture.componentRef.setInput('options', [{ value: '2026-09', label: 'September 2026' }]);
    fixture.detectChanges();

    let selected: string | null = null;
    fixture.componentInstance.valueChange.subscribe(value => selected = value);
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '2026-09';
    select.dispatchEvent(new Event('change'));

    expect(selected).toBe('2026-09');
  });

  it('exposes month selector accessibility attributes and disabled state', async () => {
    await TestBed.configureTestingModule({ imports: [MonthSelectorComponent] }).compileComponents();

    const fixture = TestBed.createComponent(MonthSelectorComponent);
    fixture.componentRef.setInput('label', 'Plan month');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('describedBy', 'month-help month-error');
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.getAttribute('aria-label')).toBe('Plan month');
    expect(select.getAttribute('aria-describedby')).toBe('month-help month-error');
    expect(select.required).toBe(true);
    expect(select.disabled).toBe(true);
  });

  it('renders a titled panel as a named region', async () => {
    await TestBed.configureTestingModule({ imports: [PanelComponent] }).compileComponents();

    const fixture = TestBed.createComponent(PanelComponent);
    fixture.componentRef.setInput('title', 'Plan details');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="region"]').getAttribute('aria-label')).toBe('Plan details');
  });

  it('renders the jar identity and formats the supplied VND amount', async () => {
    await TestBed.configureTestingModule({ imports: [JarCardComponent] }).compileComponents();

    const fixture = TestBed.createComponent(JarCardComponent);
    fixture.componentRef.setInput('jarType', 'food');
    fixture.componentRef.setInput('name', 'Food');
    fixture.componentRef.setInput('percentage', 20);
    fixture.componentRef.setInput('amountVnd', '1250000');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ff-jar-card--food')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Food');
    expect(fixture.nativeElement.textContent).toContain('20%');
    expect(
      fixture.nativeElement.querySelector('.ff-jar-card__identity .ff-jar-card__percentage')?.textContent?.trim()
    ).toBe('20%');
    expect(fixture.nativeElement.querySelector('.ff-jar-card__amount > span')?.textContent?.trim()).toBe('Budget');
    expect(fixture.nativeElement.textContent).toContain('1,250,000 VND');
  });

  it('renders a decorative icon for every canonical jar type', async () => {
    await TestBed.configureTestingModule({ imports: [JarCardComponent] }).compileComponents();

    const fixture = TestBed.createComponent(JarCardComponent);
    fixture.componentRef.setInput('jarType', 'livingExpenses');
    fixture.componentRef.setInput('name', 'Jar');

    for (const jarType of [
      'livingExpenses',
      'food',
      'children',
      'emergencyFund',
      'savings',
      'investment',
      'entertainmentAndTravel'
    ] as const) {
      fixture.componentRef.setInput('jarType', jarType);
      fixture.detectChanges();

      const marker = fixture.nativeElement.querySelector('.ff-jar-card__marker') as HTMLElement;
      const icon = marker.querySelector('svg') as SVGElement | null;
      expect(icon).not.toBeNull();
      expect(icon?.querySelector('path, circle')).not.toBeNull();
      expect(marker.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('uses a projected jar icon instead of the default icon when supplied', async () => {
    await TestBed.configureTestingModule({ imports: [JarCardWithCustomIconHostComponent] }).compileComponents();

    const fixture = TestBed.createComponent(JarCardWithCustomIconHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-test-icon="custom"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ff-jar-card__icon')).toBeNull();
  });

  it('projects an optional progress bar inside the jar card and omits an empty amount label', async () => {
    await TestBed.configureTestingModule({ imports: [JarCardWithProgressHostComponent] }).compileComponents();

    const fixture = TestBed.createComponent(JarCardWithProgressHostComponent);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.ff-jar-card') as HTMLElement;
    const progress = card.querySelector('[data-test-progress]');

    expect(progress).not.toBeNull();
    expect(card.contains(progress)).toBe(true);
    expect(card.querySelector('.ff-jar-card__amount > span')).toBeNull();
  });

  it('renders a metric label and value', async () => {
    await TestBed.configureTestingModule({ imports: [MetricCardComponent] }).compileComponents();

    const fixture = TestBed.createComponent(MetricCardComponent);
    fixture.componentRef.setInput('label', 'Monthly income');
    fixture.componentRef.setInput('value', '25,000,000 VND');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Monthly income');
    expect(fixture.nativeElement.textContent).toContain('25,000,000 VND');
  });

  it('caps only the progress visualization and accessible numeric value', async () => {
    await TestBed.configureTestingModule({ imports: [ProgressBarComponent] }).compileComponents();

    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('label', 'Food spending');
    fixture.componentRef.setInput('value', 125);
    fixture.componentRef.setInput('valueText', '125% - over budget');
    fixture.componentRef.setInput('overBudget', true);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    const fill = fixture.nativeElement.querySelector('.ff-progress__fill') as HTMLElement;
    expect(progress.getAttribute('aria-valuenow')).toBe('100');
    expect(progress.getAttribute('aria-valuetext')).toBe('125% - over budget');
    expect(fill.style.width).toBe('100%');
    expect(fixture.nativeElement.textContent).toContain('125% - over budget');
  });

  it('uses the supplied progress maximum without changing the displayed value', async () => {
    await TestBed.configureTestingModule({ imports: [ProgressBarComponent] }).compileComponents();

    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('label', 'Annual budget');
    fixture.componentRef.setInput('value', 150);
    fixture.componentRef.setInput('max', 200);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    const fill = fixture.nativeElement.querySelector('.ff-progress__fill') as HTMLElement;
    expect(progress.getAttribute('aria-valuemax')).toBe('200');
    expect(progress.getAttribute('aria-valuenow')).toBe('150');
    expect(progress.getAttribute('aria-valuetext')).toBe('150%');
    expect(fill.style.width).toBe('75%');
  });

  it('associates form-field labels and messages with the control id', async () => {
    await TestBed.configureTestingModule({ imports: [FormFieldComponent] }).compileComponents();

    const fixture = TestBed.createComponent(FormFieldComponent);
    fixture.componentRef.setInput('controlId', 'income');
    fixture.componentRef.setInput('label', 'Monthly income');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('helpText', 'Enter a positive amount.');
    fixture.componentRef.setInput('errorMessage', 'Income is required.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('label').getAttribute('for')).toBe('income');
    expect(fixture.componentInstance.describedBy).toBe('income-help income-error');
    expect(fixture.nativeElement.querySelector('#income-help').textContent).toContain('Enter a positive amount.');
    expect(fixture.nativeElement.querySelector('#income-error')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('(required)');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Income is required.');
  });

  it('passes raw VND input strings to Angular forms without coercion', async () => {
    await TestBed.configureTestingModule({ imports: [VndAmountInputComponent] }).compileComponents();

    const fixture = TestBed.createComponent(VndAmountInputComponent);
    fixture.componentRef.setInput('inputId', 'income');
    fixture.detectChanges();

    let changedValue = '';
    fixture.componentInstance.registerOnChange((value: string) => changedValue = value);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '0012500';
    input.dispatchEvent(new Event('input'));

    expect(changedValue).toBe('0012500');
    expect(fixture.componentInstance.value).toBe('0012500');
  });

  it('groups VND digits with periods while emitting the raw value and preserving the caret', async () => {
    await TestBed.configureTestingModule({ imports: [VndAmountInputComponent] }).compileComponents();

    const fixture = TestBed.createComponent(VndAmountInputComponent);
    fixture.componentRef.setInput('inputId', 'income');
    fixture.componentRef.setInput('groupThousands', true);
    fixture.detectChanges();

    let changedValue = '';
    fixture.componentInstance.registerOnChange((value: string) => changedValue = value);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = '1000';
    input.setSelectionRange(4, 4);
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('1.000');
    expect(input.selectionStart).toBe(5);
    expect(changedValue).toBe('1000');

    input.value = '1.2000';
    input.setSelectionRange(3, 3);
    input.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: '2', bubbles: true }));

    expect(input.value).toBe('12.000');
    expect(input.selectionStart).toBe(2);
    expect(changedValue).toBe('12000');

    input.value = '1.2';
    input.dispatchEvent(new InputEvent('input', { inputType: 'insertFromPaste', data: '1.2', bubbles: true }));

    expect(input.value).toBe('1.2');
    expect(changedValue).toBe('1.2');

    input.value = '25,000,000';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('25,000,000');
    expect(changedValue).toBe('25,000,000');
  });

  it('integrates the VND input with Angular forms value, touched, and disabled states', async () => {
    await TestBed.configureTestingModule({ imports: [VndAmountInputHostComponent] }).compileComponents();

    const fixture = TestBed.createComponent(VndAmountInputHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('1250');

    fixture.componentInstance.amount.setValue('2500');
    fixture.detectChanges();
    expect(input.value).toBe('2500');

    input.value = '3750';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.amount.value).toBe('3750');

    input.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.amount.touched).toBe(true);

    fixture.componentInstance.amount.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });

  it('uses alert semantics for errors and status semantics for other states', async () => {
    await TestBed.configureTestingModule({ imports: [StatePanelComponent] }).compileComponents();

    const fixture = TestBed.createComponent(StatePanelComponent);
    fixture.componentRef.setInput('variant', 'error');
    fixture.componentRef.setInput('title', 'Unable to load plan');
    fixture.componentRef.setInput('message', 'Try again.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.componentInstance.liveMode).toBe('assertive');
  });

  it('uses polite status semantics for non-error states', async () => {
    await TestBed.configureTestingModule({ imports: [StatePanelComponent] }).compileComponents();

    const fixture = TestBed.createComponent(StatePanelComponent);
    fixture.componentRef.setInput('title', 'Monthly plan unavailable');
    fixture.componentRef.setInput('message', 'Create a plan to continue.');

    for (const variant of ['empty', 'loading', 'unavailable'] as const) {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();

      const state = fixture.nativeElement.querySelector('section');
      expect(state.getAttribute('role')).toBe('status');
      expect(state.getAttribute('aria-live')).toBe('polite');
    }
  });

  it('can focus the VND amount control for form validation feedback', async () => {
    await TestBed.configureTestingModule({
      imports: [VndAmountInputComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(VndAmountInputComponent);
    fixture.componentRef.setInput('inputId', 'income');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    fixture.componentInstance.focus();

    expect(fixture.nativeElement.querySelectorAll('[id="income"]')).toHaveLength(1);
    expect(document.activeElement).toBe(input);
  });

  it('formats whole VND strings without converting them to JavaScript numbers', () => {
    const pipe = new VndAmountPipe();

    expect(pipe.transform('12345678901234567890')).toBe('12,345,678,901,234,567,890 VND');
    expect(pipe.transform('-1250000')).toBe('-1,250,000 VND');
    expect(pipe.transform('0000')).toBe('0 VND');
    expect(pipe.transform('not-money')).toBe('not-money');
    expect(pipe.transform(null)).toBe('');
  });
});
