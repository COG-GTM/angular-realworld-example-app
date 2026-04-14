import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { TestComponent } from './components/test/test.component';
import { TestDirectiveComponent } from './components/test-directive/test-directive.component';

@NgModule({
  imports: [BrowserModule, AppComponent, TestComponent, TestDirectiveComponent],
})
export class AppModule {}
