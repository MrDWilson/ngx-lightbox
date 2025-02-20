import { FileSaverService } from 'ngx-filesaver';
import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, Inject, Input, Renderer2, SecurityContext, ViewChild, } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LIGHTBOX_EVENT, LightboxEvent, LightboxWindowRef, } from './lightbox-event.service';
import * as i0 from "@angular/core";
import * as i1 from "./lightbox-event.service";
import * as i2 from "ngx-filesaver";
import * as i3 from "@angular/platform-browser";
const _c0 = ["outerContainer"];
const _c1 = ["container"];
const _c2 = ["leftArrow"];
const _c3 = ["rightArrow"];
const _c4 = ["navArrow"];
const _c5 = ["dataContainer"];
const _c6 = ["image"];
const _c7 = ["caption"];
const _c8 = ["number"];
const _c9 = ["lb-content", ""];
export class LightboxComponent {
    constructor(_elemRef, _rendererRef, _lightboxEvent, _lightboxElem, _lightboxWindowRef, _fileSaverService, _sanitizer, _documentRef) {
        this._elemRef = _elemRef;
        this._rendererRef = _rendererRef;
        this._lightboxEvent = _lightboxEvent;
        this._lightboxElem = _lightboxElem;
        this._lightboxWindowRef = _lightboxWindowRef;
        this._fileSaverService = _fileSaverService;
        this._sanitizer = _sanitizer;
        this._documentRef = _documentRef;
        // initialize data
        this.options = this.options || {};
        this.album = this.album || [];
        this.currentImageIndex = this.currentImageIndex || 0;
        this._windowRef = this._lightboxWindowRef.nativeWindow;
        // control the interactive of the directive
        this.ui = {
            // control the appear of the reloader
            // false: image has loaded completely and ready to be shown
            // true: image is still loading
            showReloader: true,
            // control the appear of the nav arrow
            // the arrowNav is the parent of both left and right arrow
            // in some cases, the parent shows but the child does not show
            showLeftArrow: false,
            showRightArrow: false,
            showArrowNav: false,
            // control the appear of the zoom and rotate buttons
            showZoomButton: false,
            showRotateButton: false,
            // control whether to show the
            // page number or not
            showPageNumber: false,
            showCaption: false,
            // control whether to show the download button or not
            showDownloadButton: false,
            classList: 'lightbox animation fadeIn'
        };
        this.content = {
            pageNumber: ''
        };
        this._event = {};
        this._lightboxElem = this._elemRef;
        this._event.subscription = this._lightboxEvent.lightboxEvent$
            .subscribe((event) => this._onReceivedEvent(event));
        this.rotate = 0;
    }
    ngOnInit() {
        this.album.forEach(album => {
            if (album.caption) {
                album.caption = this._sanitizer.sanitize(SecurityContext.HTML, album.caption);
            }
        });
    }
    ngAfterViewInit() {
        // need to init css value here, after the view ready
        // actually these values are always 0
        this._cssValue = {
            containerTopPadding: Math.round(this._getCssStyleValue(this._containerElem, 'padding-top')),
            containerRightPadding: Math.round(this._getCssStyleValue(this._containerElem, 'padding-right')),
            containerBottomPadding: Math.round(this._getCssStyleValue(this._containerElem, 'padding-bottom')),
            containerLeftPadding: Math.round(this._getCssStyleValue(this._containerElem, 'padding-left')),
            imageBorderWidthTop: Math.round(this._getCssStyleValue(this._imageElem, 'border-top-width')),
            imageBorderWidthBottom: Math.round(this._getCssStyleValue(this._imageElem, 'border-bottom-width')),
            imageBorderWidthLeft: Math.round(this._getCssStyleValue(this._imageElem, 'border-left-width')),
            imageBorderWidthRight: Math.round(this._getCssStyleValue(this._imageElem, 'border-right-width'))
        };
        if (this._validateInputData()) {
            this._prepareComponent();
            this._registerImageLoadingEvent();
        }
    }
    ngOnDestroy() {
        if (!this.options.disableKeyboardNav) {
            // unbind keyboard event
            this._disableKeyboardNav();
        }
        this._event.subscription.unsubscribe();
    }
    close($event) {
        $event.stopPropagation();
        if ($event.target.classList.contains('lightbox') ||
            $event.target.classList.contains('lb-loader') ||
            $event.target.classList.contains('lb-close')) {
            this._lightboxEvent.broadcastLightboxEvent({ id: LIGHTBOX_EVENT.CLOSE, data: null });
        }
    }
    download($event) {
        $event.stopPropagation();
        const url = this.album[this.currentImageIndex].src;
        const downloadUrl = this.album[this.currentImageIndex].downloadUrl;
        const regex = /([^\/]+)(?=\?)/;
        const matched = regex.exec(url);
        let fileName = "";
        if (matched != null) {
            fileName = matched[1];
        }
        else {
            const parts = url.split('/');
            fileName = parts[parts.length - 1];
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const preloader = new Image();
        const _this = this;
        preloader.onload = function () {
            // @ts-ignore
            canvas.width = this.naturalWidth;
            // @ts-ignore
            canvas.height = this.naturalHeight;
            // @ts-ignore
            ctx.drawImage(this, 0, 0);
            canvas.toBlob(function (blob) {
                _this._fileSaverService.save(blob, fileName);
            }, 'image/jpeg', 0.75);
        };
        preloader.crossOrigin = '';
        let sanitized;
        if (downloadUrl && downloadUrl.length > 0) {
            sanitized = this._sanitizer.sanitize(SecurityContext.URL, downloadUrl);
        }
        else {
            sanitized = this._sanitizer.sanitize(SecurityContext.URL, url);
        }
        if (sanitized) {
            preloader.src = sanitized;
        }
    }
    control($event) {
        $event.stopPropagation();
        let height;
        let width;
        if ($event.target.classList.contains('lb-turnLeft')) {
            this.rotate = this.rotate - 90;
            this._rotateContainer();
            this._calcTransformPoint();
            this._documentRef.getElementById('image').style.transform = `rotate(${this.rotate}deg)`;
            this._documentRef.getElementById('image').style.webkitTransform = `rotate(${this.rotate}deg)`;
            this._lightboxEvent.broadcastLightboxEvent({ id: LIGHTBOX_EVENT.ROTATE_LEFT, data: null });
        }
        else if ($event.target.classList.contains('lb-turnRight')) {
            this.rotate = this.rotate + 90;
            this._rotateContainer();
            this._calcTransformPoint();
            this._documentRef.getElementById('image').style.transform = `rotate(${this.rotate}deg)`;
            this._documentRef.getElementById('image').style.webkitTransform = `rotate(${this.rotate}deg)`;
            this._lightboxEvent.broadcastLightboxEvent({ id: LIGHTBOX_EVENT.ROTATE_RIGHT, data: null });
        }
        else if ($event.target.classList.contains('lb-zoomOut')) {
            height = parseInt(this._documentRef.getElementById('outerContainer').style.height, 10) / 1.5;
            width = parseInt(this._documentRef.getElementById('outerContainer').style.width, 10) / 1.5;
            this._documentRef.getElementById('outerContainer').style.height = height + 'px';
            this._documentRef.getElementById('outerContainer').style.width = width + 'px';
            height = parseInt(this._documentRef.getElementById('image').style.height, 10) / 1.5;
            width = parseInt(this._documentRef.getElementById('image').style.width, 10) / 1.5;
            this._documentRef.getElementById('image').style.height = height + 'px';
            this._documentRef.getElementById('image').style.width = width + 'px';
            this._lightboxEvent.broadcastLightboxEvent({ id: LIGHTBOX_EVENT.ZOOM_OUT, data: null });
        }
        else if ($event.target.classList.contains('lb-zoomIn')) {
            height = parseInt(this._documentRef.getElementById('outerContainer').style.height, 10) * 1.5;
            width = parseInt(this._documentRef.getElementById('outerContainer').style.width, 10) * 1.5;
            this._documentRef.getElementById('outerContainer').style.height = height + 'px';
            this._documentRef.getElementById('outerContainer').style.width = width + 'px';
            height = parseInt(this._documentRef.getElementById('image').style.height, 10) * 1.5;
            width = parseInt(this._documentRef.getElementById('image').style.width, 10) * 1.5;
            this._documentRef.getElementById('image').style.height = height + 'px';
            this._documentRef.getElementById('image').style.width = width + 'px';
            this._lightboxEvent.broadcastLightboxEvent({ id: LIGHTBOX_EVENT.ZOOM_IN, data: null });
        }
    }
    _rotateContainer() {
        let temp = this.rotate;
        if (temp < 0) {
            temp *= -1;
        }
        if (temp / 90 % 4 === 1 || temp / 90 % 4 === 3) {
            this._documentRef.getElementById('outerContainer').style.height = this._documentRef.getElementById('image').style.width;
            this._documentRef.getElementById('outerContainer').style.width = this._documentRef.getElementById('image').style.height;
            this._documentRef.getElementById('container').style.height = this._documentRef.getElementById('image').style.width;
            this._documentRef.getElementById('container').style.width = this._documentRef.getElementById('image').style.height;
        }
        else {
            this._documentRef.getElementById('outerContainer').style.height = this._documentRef.getElementById('image').style.height;
            this._documentRef.getElementById('outerContainer').style.width = this._documentRef.getElementById('image').style.width;
            this._documentRef.getElementById('container').style.height = this._documentRef.getElementById('image').style.width;
            this._documentRef.getElementById('container').style.width = this._documentRef.getElementById('image').style.height;
        }
    }
    _resetImage() {
        this.rotate = 0;
        this._documentRef.getElementById('image').style.transform = `rotate(${this.rotate}deg)`;
        this._documentRef.getElementById('image').style.webkitTransform = `rotate(${this.rotate}deg)`;
    }
    _calcTransformPoint() {
        let height = parseInt(this._documentRef.getElementById('image').style.height, 10);
        let width = parseInt(this._documentRef.getElementById('image').style.width, 10);
        let temp = this.rotate % 360;
        if (temp < 0) {
            temp = 360 + temp;
        }
        if (temp === 90) {
            this._documentRef.getElementById('image').style.transformOrigin = (height / 2) + 'px ' + (height / 2) + 'px';
        }
        else if (temp === 180) {
            this._documentRef.getElementById('image').style.transformOrigin = (width / 2) + 'px ' + (height / 2) + 'px';
        }
        else if (temp === 270) {
            this._documentRef.getElementById('image').style.transformOrigin = (width / 2) + 'px ' + (width / 2) + 'px';
        }
    }
    nextImage() {
        if (this.album.length === 1) {
            return;
        }
        else if (this.currentImageIndex === this.album.length - 1) {
            this._changeImage(0);
        }
        else {
            this._changeImage(this.currentImageIndex + 1);
        }
    }
    prevImage() {
        if (this.album.length === 1) {
            return;
        }
        else if (this.currentImageIndex === 0 && this.album.length > 1) {
            this._changeImage(this.album.length - 1);
        }
        else {
            this._changeImage(this.currentImageIndex - 1);
        }
    }
    _validateInputData() {
        if (this.album &&
            this.album instanceof Array &&
            this.album.length > 0) {
            for (let i = 0; i < this.album.length; i++) {
                // check whether each _nside
                // album has src data or not
                if (this.album[i].src) {
                    continue;
                }
                throw new Error('One of the album data does not have source data');
            }
        }
        else {
            throw new Error('No album data or album data is not correct in type');
        }
        // to prevent data understand as string
        // convert it to number
        if (isNaN(this.currentImageIndex)) {
            throw new Error('Current image index is not a number');
        }
        else {
            this.currentImageIndex = Number(this.currentImageIndex);
        }
        return true;
    }
    _registerImageLoadingEvent() {
        const preloader = new Image();
        preloader.onload = () => {
            this._onLoadImageSuccess();
        };
        const src = this.album[this.currentImageIndex].src;
        preloader.src = this._sanitizer.sanitize(SecurityContext.URL, src);
    }
    /**
     * Fire when the image is loaded
     */
    _onLoadImageSuccess() {
        if (!this.options.disableKeyboardNav) {
            // unbind keyboard event during transition
            this._disableKeyboardNav();
        }
        let imageHeight;
        let imageWidth;
        let maxImageHeight;
        let maxImageWidth;
        let windowHeight;
        let windowWidth;
        let naturalImageWidth;
        let naturalImageHeight;
        // set default width and height of image to be its natural
        imageWidth = naturalImageWidth = this._imageElem.nativeElement.naturalWidth;
        imageHeight = naturalImageHeight = this._imageElem.nativeElement.naturalHeight;
        if (this.options.fitImageInViewPort) {
            windowWidth = this._windowRef.innerWidth;
            windowHeight = this._windowRef.innerHeight;
            maxImageWidth = windowWidth - this._cssValue.containerLeftPadding -
                this._cssValue.containerRightPadding - this._cssValue.imageBorderWidthLeft -
                this._cssValue.imageBorderWidthRight - 20;
            maxImageHeight = windowHeight - this._cssValue.containerTopPadding -
                this._cssValue.containerTopPadding - this._cssValue.imageBorderWidthTop -
                this._cssValue.imageBorderWidthBottom - 120;
            if (naturalImageWidth > maxImageWidth || naturalImageHeight > maxImageHeight) {
                if ((naturalImageWidth / maxImageWidth) > (naturalImageHeight / maxImageHeight)) {
                    imageWidth = maxImageWidth;
                    imageHeight = Math.round(naturalImageHeight / (naturalImageWidth / imageWidth));
                }
                else {
                    imageHeight = maxImageHeight;
                    imageWidth = Math.round(naturalImageWidth / (naturalImageHeight / imageHeight));
                }
            }
            this._rendererRef.setStyle(this._imageElem.nativeElement, 'width', `${imageWidth}px`);
            this._rendererRef.setStyle(this._imageElem.nativeElement, 'height', `${imageHeight}px`);
        }
        this._sizeContainer(imageWidth, imageHeight);
        if (this.options.centerVertically) {
            this._centerVertically(imageWidth, imageHeight);
        }
    }
    _centerVertically(imageWidth, imageHeight) {
        const scrollOffset = this._documentRef.documentElement.scrollTop;
        const windowHeight = this._windowRef.innerHeight;
        const viewOffset = windowHeight / 2 - imageHeight / 2;
        const topDistance = scrollOffset + viewOffset;
        this._rendererRef.setStyle(this._lightboxElem.nativeElement, 'top', `${topDistance}px`);
    }
    _sizeContainer(imageWidth, imageHeight) {
        const oldWidth = this._outerContainerElem.nativeElement.offsetWidth;
        const oldHeight = this._outerContainerElem.nativeElement.offsetHeight;
        const newWidth = imageWidth + this._cssValue.containerRightPadding + this._cssValue.containerLeftPadding +
            this._cssValue.imageBorderWidthLeft + this._cssValue.imageBorderWidthRight;
        const newHeight = imageHeight + this._cssValue.containerTopPadding + this._cssValue.containerBottomPadding +
            this._cssValue.imageBorderWidthTop + this._cssValue.imageBorderWidthBottom;
        // make sure that distances are large enough for transitionend event to be fired, at least 5px.
        if (Math.abs(oldWidth - newWidth) + Math.abs(oldHeight - newHeight) > 5) {
            this._rendererRef.setStyle(this._outerContainerElem.nativeElement, 'width', `${newWidth}px`);
            this._rendererRef.setStyle(this._outerContainerElem.nativeElement, 'height', `${newHeight}px`);
            // bind resize event to outer container
            // use enableTransition to prevent infinite loader
            if (this.options.enableTransition) {
                this._event.transitions = [];
                ['transitionend', 'webkitTransitionEnd', 'oTransitionEnd', 'MSTransitionEnd'].forEach(eventName => {
                    this._event.transitions.push(this._rendererRef.listen(this._outerContainerElem.nativeElement, eventName, (event) => {
                        if (event.target === event.currentTarget) {
                            this._postResize(newWidth, newHeight);
                        }
                    }));
                });
            }
            else {
                this._postResize(newWidth, newHeight);
            }
        }
        else {
            this._postResize(newWidth, newHeight);
        }
    }
    _postResize(newWidth, newHeight) {
        // unbind resize event
        if (Array.isArray(this._event.transitions)) {
            this._event.transitions.forEach((eventHandler) => {
                eventHandler();
            });
            this._event.transitions = [];
        }
        this._rendererRef.setStyle(this._dataContainerElem.nativeElement, 'width', `${newWidth}px`);
        this._showImage();
    }
    _showImage() {
        this.ui.showReloader = false;
        this._updateNav();
        this._updateDetails();
        if (!this.options.disableKeyboardNav) {
            this._enableKeyboardNav();
        }
    }
    _prepareComponent() {
        // add css3 animation
        this._addCssAnimation();
        // position the image according to user's option
        this._positionLightBox();
        // update controls visibility on next view generation
        setTimeout(() => {
            this.ui.showZoomButton = this.options.showZoom;
            this.ui.showRotateButton = this.options.showRotate;
            this.ui.showDownloadButton = this.options.showDownloadButton;
        }, 0);
    }
    _positionLightBox() {
        // @see https://stackoverflow.com/questions/3464876/javascript-get-window-x-y-position-for-scroll
        const top = (this._windowRef.pageYOffset || this._documentRef.documentElement.scrollTop) +
            this.options.positionFromTop;
        const left = this._windowRef.pageXOffset || this._documentRef.documentElement.scrollLeft;
        if (!this.options.centerVertically) {
            this._rendererRef.setStyle(this._lightboxElem.nativeElement, 'top', `${top}px`);
        }
        this._rendererRef.setStyle(this._lightboxElem.nativeElement, 'left', `${left}px`);
        this._rendererRef.setStyle(this._lightboxElem.nativeElement, 'display', 'block');
        // disable scrolling of the page while open
        if (this.options.disableScrolling) {
            this._rendererRef.addClass(this._documentRef.documentElement, 'lb-disable-scrolling');
        }
    }
    /**
     * addCssAnimation add css3 classes for animate lightbox
     */
    _addCssAnimation() {
        const resizeDuration = this.options.resizeDuration;
        const fadeDuration = this.options.fadeDuration;
        this._rendererRef.setStyle(this._lightboxElem.nativeElement, '-webkit-animation-duration', `${fadeDuration}s`);
        this._rendererRef.setStyle(this._lightboxElem.nativeElement, 'animation-duration', `${fadeDuration}s`);
        this._rendererRef.setStyle(this._outerContainerElem.nativeElement, '-webkit-transition-duration', `${resizeDuration}s`);
        this._rendererRef.setStyle(this._outerContainerElem.nativeElement, 'transition-duration', `${resizeDuration}s`);
        this._rendererRef.setStyle(this._dataContainerElem.nativeElement, '-webkit-animation-duration', `${fadeDuration}s`);
        this._rendererRef.setStyle(this._dataContainerElem.nativeElement, 'animation-duration', `${fadeDuration}s`);
        this._rendererRef.setStyle(this._imageElem.nativeElement, '-webkit-animation-duration', `${fadeDuration}s`);
        this._rendererRef.setStyle(this._imageElem.nativeElement, 'animation-duration', `${fadeDuration}s`);
        this._rendererRef.setStyle(this._captionElem.nativeElement, '-webkit-animation-duration', `${fadeDuration}s`);
        this._rendererRef.setStyle(this._captionElem.nativeElement, 'animation-duration', `${fadeDuration}s`);
        this._rendererRef.setStyle(this._numberElem.nativeElement, '-webkit-animation-duration', `${fadeDuration}s`);
        this._rendererRef.setStyle(this._numberElem.nativeElement, 'animation-duration', `${fadeDuration}s`);
    }
    _end() {
        this.ui.classList = 'lightbox animation fadeOut';
        if (this.options.disableScrolling) {
            this._rendererRef.removeClass(this._documentRef.documentElement, 'lb-disable-scrolling');
        }
        setTimeout(() => {
            this.cmpRef.destroy();
        }, this.options.fadeDuration * 1000);
    }
    _updateDetails() {
        // update the caption
        if (typeof this.album[this.currentImageIndex].caption !== 'undefined' &&
            this.album[this.currentImageIndex].caption !== '') {
            this.ui.showCaption = true;
        }
        // update the page number if user choose to do so
        // does not perform numbering the page if the
        // array length in album <= 1
        if (this.album.length > 1 && this.options.showImageNumberLabel) {
            this.ui.showPageNumber = true;
            this.content.pageNumber = this._albumLabel();
        }
    }
    _albumLabel() {
        // due to {this.currentImageIndex} is set from 0 to {this.album.length} - 1
        return this.options.albumLabel.replace(/%1/g, Number(this.currentImageIndex + 1)).replace(/%2/g, this.album.length);
    }
    _changeImage(newIndex) {
        this._resetImage();
        this.currentImageIndex = newIndex;
        this._hideImage();
        this._registerImageLoadingEvent();
        this._lightboxEvent.broadcastLightboxEvent({ id: LIGHTBOX_EVENT.CHANGE_PAGE, data: newIndex });
    }
    _hideImage() {
        this.ui.showReloader = true;
        this.ui.showArrowNav = false;
        this.ui.showLeftArrow = false;
        this.ui.showRightArrow = false;
        this.ui.showPageNumber = false;
        this.ui.showCaption = false;
    }
    _updateNav() {
        let alwaysShowNav = false;
        // check to see the browser support touch event
        try {
            this._documentRef.createEvent('TouchEvent');
            alwaysShowNav = (this.options.alwaysShowNavOnTouchDevices) ? true : false;
        }
        catch (e) {
            // noop
        }
        // initially show the arrow nav
        // which is the parent of both left and right nav
        this._showArrowNav();
        if (this.album.length > 1) {
            if (this.options.wrapAround) {
                if (alwaysShowNav) {
                    // alternatives this.$lightbox.find('.lb-prev, .lb-next').css('opacity', '1');
                    this._rendererRef.setStyle(this._leftArrowElem.nativeElement, 'opacity', '1');
                    this._rendererRef.setStyle(this._rightArrowElem.nativeElement, 'opacity', '1');
                }
                // alternatives this.$lightbox.find('.lb-prev, .lb-next').show();
                this._showLeftArrowNav();
                this._showRightArrowNav();
            }
            else {
                if (this.currentImageIndex > 0) {
                    // alternatives this.$lightbox.find('.lb-prev').show();
                    this._showLeftArrowNav();
                    if (alwaysShowNav) {
                        // alternatives this.$lightbox.find('.lb-prev').css('opacity', '1');
                        this._rendererRef.setStyle(this._leftArrowElem.nativeElement, 'opacity', '1');
                    }
                }
                if (this.currentImageIndex < this.album.length - 1) {
                    // alternatives this.$lightbox.find('.lb-next').show();
                    this._showRightArrowNav();
                    if (alwaysShowNav) {
                        // alternatives this.$lightbox.find('.lb-next').css('opacity', '1');
                        this._rendererRef.setStyle(this._rightArrowElem.nativeElement, 'opacity', '1');
                    }
                }
            }
        }
    }
    _showLeftArrowNav() {
        this.ui.showLeftArrow = true;
    }
    _showRightArrowNav() {
        this.ui.showRightArrow = true;
    }
    _showArrowNav() {
        this.ui.showArrowNav = (this.album.length !== 1);
    }
    _enableKeyboardNav() {
        this._event.keyup = this._rendererRef.listen('document', 'keyup', (event) => {
            this._keyboardAction(event);
        });
    }
    _disableKeyboardNav() {
        if (this._event.keyup) {
            this._event.keyup();
        }
    }
    _keyboardAction($event) {
        const KEYCODE_ESC = 27;
        const KEYCODE_LEFTARROW = 37;
        const KEYCODE_RIGHTARROW = 39;
        const keycode = $event.keyCode;
        const key = String.fromCharCode(keycode).toLowerCase();
        if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
            this._lightboxEvent.broadcastLightboxEvent({ id: LIGHTBOX_EVENT.CLOSE, data: null });
        }
        else if (key === 'p' || keycode === KEYCODE_LEFTARROW) {
            if (this.currentImageIndex !== 0) {
                this._changeImage(this.currentImageIndex - 1);
            }
            else if (this.options.wrapAround && this.album.length > 1) {
                this._changeImage(this.album.length - 1);
            }
        }
        else if (key === 'n' || keycode === KEYCODE_RIGHTARROW) {
            if (this.currentImageIndex !== this.album.length - 1) {
                this._changeImage(this.currentImageIndex + 1);
            }
            else if (this.options.wrapAround && this.album.length > 1) {
                this._changeImage(0);
            }
        }
    }
    _getCssStyleValue(elem, propertyName) {
        return parseFloat(this._windowRef
            .getComputedStyle(elem.nativeElement, null)
            .getPropertyValue(propertyName));
    }
    _onReceivedEvent(event) {
        switch (event.id) {
            case LIGHTBOX_EVENT.CLOSE:
                this._end();
                break;
            default:
                break;
        }
    }
}
LightboxComponent.ɵfac = function LightboxComponent_Factory(t) { return new (t || LightboxComponent)(i0.ɵɵdirectiveInject(i0.ElementRef), i0.ɵɵdirectiveInject(i0.Renderer2), i0.ɵɵdirectiveInject(i1.LightboxEvent), i0.ɵɵdirectiveInject(i0.ElementRef), i0.ɵɵdirectiveInject(i1.LightboxWindowRef), i0.ɵɵdirectiveInject(i2.FileSaverService), i0.ɵɵdirectiveInject(i3.DomSanitizer), i0.ɵɵdirectiveInject(DOCUMENT)); };
LightboxComponent.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: LightboxComponent, selectors: [["", "lb-content", ""]], viewQuery: function LightboxComponent_Query(rf, ctx) { if (rf & 1) {
        i0.ɵɵviewQuery(_c0, 5);
        i0.ɵɵviewQuery(_c1, 5);
        i0.ɵɵviewQuery(_c2, 5);
        i0.ɵɵviewQuery(_c3, 5);
        i0.ɵɵviewQuery(_c4, 5);
        i0.ɵɵviewQuery(_c5, 5);
        i0.ɵɵviewQuery(_c6, 5);
        i0.ɵɵviewQuery(_c7, 5);
        i0.ɵɵviewQuery(_c8, 5);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx._outerContainerElem = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx._containerElem = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx._leftArrowElem = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx._rightArrowElem = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx._navArrowElem = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx._dataContainerElem = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx._imageElem = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx._captionElem = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx._numberElem = _t.first);
    } }, hostVars: 2, hostBindings: function LightboxComponent_HostBindings(rf, ctx) { if (rf & 1) {
        i0.ɵɵlistener("click", function LightboxComponent_click_HostBindingHandler($event) { return ctx.close($event); });
    } if (rf & 2) {
        i0.ɵɵclassMap(ctx.ui.classList);
    } }, inputs: { album: "album", currentImageIndex: "currentImageIndex", options: "options", cmpRef: "cmpRef" }, attrs: _c9, decls: 34, vars: 14, consts: [["id", "outerContainer", 1, "lb-outerContainer", "transition"], ["outerContainer", ""], ["id", "container", 1, "lb-container"], ["container", ""], ["id", "image", 1, "lb-image", "animation", "fadeIn", 3, "src", "hidden"], ["image", ""], [1, "lb-nav", 3, "hidden"], ["navArrow", ""], [1, "lb-prev", 3, "hidden", "click"], ["leftArrow", ""], [1, "lb-next", 3, "hidden", "click"], ["rightArrow", ""], [1, "lb-loader", 3, "hidden", "click"], [1, "lb-cancel"], [1, "lb-dataContainer", 3, "hidden"], ["dataContainer", ""], [1, "lb-data"], [1, "lb-details"], [1, "lb-caption", "animation", "fadeIn", 3, "hidden", "innerHtml"], ["caption", ""], [1, "lb-number", "animation", "fadeIn", 3, "hidden"], ["number", ""], [1, "lb-controlContainer"], [1, "lb-closeContainer"], [1, "lb-close", 3, "click"], [1, "lb-downloadContainer", 3, "hidden"], [1, "lb-download", 3, "click"], [1, "lb-turnContainer", 3, "hidden"], [1, "lb-turnLeft", 3, "click"], [1, "lb-turnRight", 3, "click"], [1, "lb-zoomContainer", 3, "hidden"], [1, "lb-zoomOut", 3, "click"], [1, "lb-zoomIn", 3, "click"]], template: function LightboxComponent_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "div", 0, 1)(2, "div", 2, 3);
        i0.ɵɵelement(4, "img", 4, 5);
        i0.ɵɵelementStart(6, "div", 6, 7)(8, "a", 8, 9);
        i0.ɵɵlistener("click", function LightboxComponent_Template_a_click_8_listener() { return ctx.prevImage(); });
        i0.ɵɵelementEnd();
        i0.ɵɵelementStart(10, "a", 10, 11);
        i0.ɵɵlistener("click", function LightboxComponent_Template_a_click_10_listener() { return ctx.nextImage(); });
        i0.ɵɵelementEnd()();
        i0.ɵɵelementStart(12, "div", 12);
        i0.ɵɵlistener("click", function LightboxComponent_Template_div_click_12_listener($event) { return ctx.close($event); });
        i0.ɵɵelement(13, "a", 13);
        i0.ɵɵelementEnd()()();
        i0.ɵɵelementStart(14, "div", 14, 15)(16, "div", 16)(17, "div", 17);
        i0.ɵɵelement(18, "span", 18, 19);
        i0.ɵɵelementStart(20, "span", 20, 21);
        i0.ɵɵtext(22);
        i0.ɵɵelementEnd()();
        i0.ɵɵelementStart(23, "div", 22)(24, "div", 23)(25, "a", 24);
        i0.ɵɵlistener("click", function LightboxComponent_Template_a_click_25_listener($event) { return ctx.close($event); });
        i0.ɵɵelementEnd()();
        i0.ɵɵelementStart(26, "div", 25)(27, "a", 26);
        i0.ɵɵlistener("click", function LightboxComponent_Template_a_click_27_listener($event) { return ctx.download($event); });
        i0.ɵɵelementEnd()();
        i0.ɵɵelementStart(28, "div", 27)(29, "a", 28);
        i0.ɵɵlistener("click", function LightboxComponent_Template_a_click_29_listener($event) { return ctx.control($event); });
        i0.ɵɵelementEnd();
        i0.ɵɵelementStart(30, "a", 29);
        i0.ɵɵlistener("click", function LightboxComponent_Template_a_click_30_listener($event) { return ctx.control($event); });
        i0.ɵɵelementEnd()();
        i0.ɵɵelementStart(31, "div", 30)(32, "a", 31);
        i0.ɵɵlistener("click", function LightboxComponent_Template_a_click_32_listener($event) { return ctx.control($event); });
        i0.ɵɵelementEnd();
        i0.ɵɵelementStart(33, "a", 32);
        i0.ɵɵlistener("click", function LightboxComponent_Template_a_click_33_listener($event) { return ctx.control($event); });
        i0.ɵɵelementEnd()()()()();
    } if (rf & 2) {
        i0.ɵɵadvance(4);
        i0.ɵɵproperty("src", ctx.album[ctx.currentImageIndex].src, i0.ɵɵsanitizeUrl)("hidden", ctx.ui.showReloader);
        i0.ɵɵadvance(2);
        i0.ɵɵproperty("hidden", !ctx.ui.showArrowNav);
        i0.ɵɵadvance(2);
        i0.ɵɵproperty("hidden", !ctx.ui.showLeftArrow);
        i0.ɵɵadvance(2);
        i0.ɵɵproperty("hidden", !ctx.ui.showRightArrow);
        i0.ɵɵadvance(2);
        i0.ɵɵproperty("hidden", !ctx.ui.showReloader);
        i0.ɵɵadvance(2);
        i0.ɵɵproperty("hidden", ctx.ui.showReloader);
        i0.ɵɵadvance(4);
        i0.ɵɵproperty("hidden", !ctx.ui.showCaption)("innerHtml", ctx.album[ctx.currentImageIndex].caption, i0.ɵɵsanitizeHtml);
        i0.ɵɵadvance(2);
        i0.ɵɵproperty("hidden", !ctx.ui.showPageNumber);
        i0.ɵɵadvance(2);
        i0.ɵɵtextInterpolate(ctx.content.pageNumber);
        i0.ɵɵadvance(4);
        i0.ɵɵproperty("hidden", !ctx.ui.showDownloadButton);
        i0.ɵɵadvance(2);
        i0.ɵɵproperty("hidden", !ctx.ui.showRotateButton);
        i0.ɵɵadvance(3);
        i0.ɵɵproperty("hidden", !ctx.ui.showZoomButton);
    } }, encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(LightboxComponent, [{
        type: Component,
        args: [{
                template: `
    <div class="lb-outerContainer transition" #outerContainer id="outerContainer">
      <div class="lb-container" #container id="container">
        <img class="lb-image"
             id="image"
             [src]="album[currentImageIndex].src"
             class="lb-image animation fadeIn"
             [hidden]="ui.showReloader"
             #image>
        <div class="lb-nav" [hidden]="!ui.showArrowNav" #navArrow>
          <a class="lb-prev" [hidden]="!ui.showLeftArrow" (click)="prevImage()" #leftArrow></a>
          <a class="lb-next" [hidden]="!ui.showRightArrow" (click)="nextImage()" #rightArrow></a>
        </div>
        <div class="lb-loader" [hidden]="!ui.showReloader" (click)="close($event)">
          <a class="lb-cancel"></a>
        </div>
      </div>
    </div>
    <div class="lb-dataContainer" [hidden]="ui.showReloader" #dataContainer>
      <div class="lb-data">
        <div class="lb-details">
          <span class="lb-caption animation fadeIn" [hidden]="!ui.showCaption" [innerHtml]="album[currentImageIndex].caption" #caption>
          </span>
          <span class="lb-number animation fadeIn" [hidden]="!ui.showPageNumber" #number>{{ content.pageNumber }}</span>
        </div>
        <div class="lb-controlContainer">
          <div class="lb-closeContainer">
            <a class="lb-close" (click)="close($event)"></a>
          </div>
          <div class="lb-downloadContainer" [hidden]="!ui.showDownloadButton">
            <a class="lb-download" (click)="download($event)"></a>
          </div>
          <div class="lb-turnContainer" [hidden]="!ui.showRotateButton">
            <a class="lb-turnLeft" (click)="control($event)"></a>
            <a class="lb-turnRight" (click)="control($event)"></a>
          </div>
          <div class="lb-zoomContainer" [hidden]="!ui.showZoomButton">
            <a class="lb-zoomOut" (click)="control($event)"></a>
            <a class="lb-zoomIn" (click)="control($event)"></a>
          </div>
        </div>
      </div>
    </div>`,
                selector: '[lb-content]',
                host: {
                    '(click)': 'close($event)',
                    '[class]': 'ui.classList'
                }
            }]
    }], function () { return [{ type: i0.ElementRef }, { type: i0.Renderer2 }, { type: i1.LightboxEvent }, { type: i0.ElementRef }, { type: i1.LightboxWindowRef }, { type: i2.FileSaverService }, { type: i3.DomSanitizer }, { type: undefined, decorators: [{
                type: Inject,
                args: [DOCUMENT]
            }] }]; }, { album: [{
            type: Input
        }], currentImageIndex: [{
            type: Input
        }], options: [{
            type: Input
        }], cmpRef: [{
            type: Input
        }], _outerContainerElem: [{
            type: ViewChild,
            args: ['outerContainer', { static: false }]
        }], _containerElem: [{
            type: ViewChild,
            args: ['container', { static: false }]
        }], _leftArrowElem: [{
            type: ViewChild,
            args: ['leftArrow', { static: false }]
        }], _rightArrowElem: [{
            type: ViewChild,
            args: ['rightArrow', { static: false }]
        }], _navArrowElem: [{
            type: ViewChild,
            args: ['navArrow', { static: false }]
        }], _dataContainerElem: [{
            type: ViewChild,
            args: ['dataContainer', { static: false }]
        }], _imageElem: [{
            type: ViewChild,
            args: ['image', { static: false }]
        }], _captionElem: [{
            type: ViewChild,
            args: ['caption', { static: false }]
        }], _numberElem: [{
            type: ViewChild,
            args: ['number', { static: false }]
        }] }); })();
//# sourceMappingURL=lightbox.component.js.map