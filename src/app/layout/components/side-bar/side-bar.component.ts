import { Component, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Location } from "@angular/common";

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}

export const ROUTES: RouteInfo[] = [
  { path: "/dashboard", title: "Dashboard", icon: "design_app", class: "" },
  {
    path: "/publisher",
    title: "Publisher",
    icon: "ui-1_calendar-60",
    class: ""
  },
  { path: "/live", title: "Live Videos", icon: "education_atom", class: "" },
  {
    path: "/vod",
    title: "Video on Demand",
    icon: "education_paper",
    class: ""
  },
  { path: "/login", title: "Logout", icon: "education_paper", class: "" }
];

@Component({
  selector: "app-side-bar",
  templateUrl: "./side-bar.component.html",
  styleUrls: ["./side-bar.component.scss"]
})
export class SideBarComponent implements OnInit {
  menuItems: any[];
  location: Location;
  sideBarOpen: boolean;
  MenuText: string = "";

  constructor(location: Location) {
    this.location = location;
    this.sideBarOpen = false;
  }

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);
  }

  openNav() {
    this.sideBarOpen = true;
  }

  closeNav() {
    this.sideBarOpen = false;
  }

  getTitle() {
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if (titlee.charAt(0) === "#") {
      titlee = titlee.slice(2);
    }
    //titlee = titlee.split('/').pop();
    //titlee = titlee.split('/')[1];

    for (var item = 0; item < ROUTES.length; item++) {
      if (ROUTES[item].path === titlee) {
        return ROUTES[item].title;
      }
    }

    //    if (titlee.includes('case'))
    //      return "Case";

    let k = titlee.split("/");
    return k[1];

    return "Dashboard";
  }

  Up() {
    if (this.getTitle() == "Dashboard") {
      this.MenuText = "Menu";
    } else {
      this.MenuText = "";
    }
    return "";
  }
}
