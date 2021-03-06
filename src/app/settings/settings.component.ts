import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LoginService } from '../login/login.service';
import { Subscription } from 'rxjs';
import { AuthData } from '../Models/authData.model';
import { mimeType } from '../shared/mime-type.validator';
import { ManageStaffService } from '../faculty-admin/manage-staff.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {

  form: FormGroup;
  imagePreview = '../../assets/images/users/default_user.png';
  private imagePath: string;
  isImageModified = false;
  // tslint:disable-next-line: max-line-length
  // isPasswordModified = (!!this.form.value.currentPassword || this.form.value.currentPassword === '' || !!this.form.value.newPassword || this.form.value.newPassword === '' || !!this.form.value.retypePassword || this.form.value.retypePassword === '');
  private loginSub: Subscription;
  private loggedUser: AuthData;
  private userProfileSub: Subscription;

  constructor(
    private loginService: LoginService,
    private staffService: ManageStaffService
    ) { }

  ngOnInit(): void {
    this.form = new FormGroup({
      image : new FormControl(
        null,
        {
          validators: [Validators.required], asyncValidators: [mimeType]
        }
      ),
      currentPassword : new FormControl(null, Validators.minLength(6)),
      newPassword: new FormControl(null, Validators.minLength(6)),
      retypePassword: new FormControl(null, Validators.minLength(6))
    });
    this.loginSub = this.loginService.loggedUser.subscribe(
      userData => {
        console.log('subscribed')
        this.loggedUser = userData;
      }
    );
    this.loginService.getImagePath(this.loggedUser.uid);
    this.userProfileSub = this.loginService.userProfile.subscribe(
      path => {
        this.imagePreview = path;
        this.imagePath = path;
        console.log('in settings component' + this.imagePreview);
      }
    );
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    console.log(file)
    this.form.patchValue({image: file});
    this.form.get('image').updateValueAndValidity();
    const reader = new FileReader();
    reader.onload = () => {
      console.log(reader);
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
    this.isImageModified = true;
  }

  onSave(){
    const currentPass = this.form.value.currentPassword;
    const newPass = this.form.value.newPassword;
    const retypePass = this.form.value.retypePassword;
    if (this.isImageModified){
      this.staffService.updateProfile(
        this.loggedUser.uid,
        this.loggedUser.email,
        this.loggedUser.name,
        this.form.value.image
      );
      this.isImageModified = false;
    }
    if (this.form.value.currentPassword !== '' && this.form.value.newPassword !== '' && this.form.value.retypePassword !== '') {
      if (newPass === retypePass){
        this.staffService.updatePassword(
          this.loggedUser.uid,
          currentPass,
          newPass
        );
      }
    }
  }

  onClear(){
    this.form.reset();
    if (this.isImageModified){
      this.imagePreview = this.imagePath;
      this.form.patchValue({image: null});
      this.isImageModified = false;
    }
  }

  ngOnDestroy(){
    this.loginSub.unsubscribe();
    this.userProfileSub.unsubscribe();
  }

}
