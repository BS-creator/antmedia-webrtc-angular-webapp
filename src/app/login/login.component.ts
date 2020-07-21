import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from "@angular/core";
import { ActivatedRoute, Router, Data } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { NgForm } from "@angular/forms";
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit {
  login: Login;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private spinner: NgxSpinnerService
  ) {
    this.login = new Login();
  }

  ngOnInit(): void {}
  Login() {
    // debugger
    this.router.navigate(["/dashboard"]);
  }
}

export class Login {
  email: string;
  password: string;
  valid: boolean;
}
