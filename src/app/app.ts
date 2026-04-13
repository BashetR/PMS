import { Component, signal } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { Loader } from "./shared/components/loader/loader";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [RouterOutlet, Loader],
  styleUrl: './app.css',
})

export class App {
  protected readonly title = signal('UI');
  
  // public constructor( private http: HttpClient, private datepipe: DatePipe, private titleService: Title) {}

  // ngOnInit() {
  // }

  // private startHttpRequest = () => {
  //   this.http.get(environment.apiUrl +  'PMS/')
  //     .subscribe(res => {
  //       console.log(res);
  //     })
  // }

  // public setTitle(newTitle: string) {
  //   this.titleService.setTitle(newTitle + ' | ' + environment.projectName);
  // }

  // // public saveMessage(newName: string) {
  // //   return (newName + '  ' + environment.saveMessage);
  // // }
  // // public updateMessage(newName: string) {
  // //   return (newName + '  ' + environment.saveMessage);
  // // }
  // // public deleteMessage(newName: string) {
  // //   return (newName + '  ' + environment.saveMessage);
  // // }
  // // public savefailedMessage(newName: string) {
  // //   return (newName + '  ' + environment.saveMessage);
  // // }
  // // public deletefailedMessage(newName: string) {
  // //   return (newName + '  ' + environment.saveMessage);
  // // }

  // public validateAllFormFields(formGroup: FormGroup) {
  //   Object.keys(formGroup.controls).forEach((field) => {
  //     const control = formGroup.get(field);
  //     if (control instanceof FormControl) {
  //       control.markAsTouched({ onlySelf: true });
  //     } else if (control instanceof FormGroup) {
  //       this.validateAllFormFields(control);
  //     }
  //   });
  // }

  // public UTCToLocalTime(utc: any) {
  //   const date = new Date(utc);
  //   const utcDate = new Date(date + ' UTC');
  //   return this.datepipe.transform(utcDate, 'MM/dd/yyyy, hh:mm:ss a');
  // }
}