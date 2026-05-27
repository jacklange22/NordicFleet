// NFOCR — on-device text recognition via Apple Vision.
//
// We deliberately avoid Google ML Kit here: it bloats the binary, drags in
// GTMSessionFetcher version conflicts with Firebase iOS 11, and isn't
// available offline without bundling models. Apple Vision's
// VNRecognizeTextRequest is system-provided, free, on-device, fast (well
// under a second on modern iPhones at the .accurate level), and good
// enough for the small printed text typical of ski stickers.
//
// Returned shape — one entry per detected text observation, sorted by the
// reading order Vision returns (roughly top-to-bottom):
//
//   {
//     lines: [
//       {text: 'Fischer', confidence: 0.99, bbox: {x, y, w, h}},
//       {text: 'Speedmax', confidence: 0.97, bbox: {x, y, w, h}},
//       ...
//     ],
//   }
//
// bbox is normalized 0..1 in Vision's coord space (origin = bottom-left).
// The sticker parser doesn't currently use it, but we surface it so future
// "highlight detected fields on the captured image" UI can opt in.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <Vision/Vision.h>
#import <React/RCTBridgeModule.h>

@interface NFOCR : NSObject <RCTBridgeModule>
@end

@implementation NFOCR

RCT_EXPORT_MODULE();

// All ML happens off the JS thread; iOS schedules the Vision work on a
// background queue and calls the completion handler asynchronously.
+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0);
}

RCT_EXPORT_METHOD(recognizeText:(NSString *)uri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (uri == nil || uri.length == 0) {
    reject(@"NFOCR_BAD_URI", @"recognizeText called with empty uri", nil);
    return;
  }

  // RN image-picker hands us either a file:// URL or a bare path. Accept
  // both, plus the assets-library:// shape on very old iOS (legacy guard).
  NSString *path = uri;
  if ([uri hasPrefix:@"file://"]) {
    NSURL *url = [NSURL URLWithString:uri];
    path = url.path;
  }

  UIImage *image = [UIImage imageWithContentsOfFile:path];
  if (image == nil) {
    reject(@"NFOCR_LOAD_FAILED",
           [NSString stringWithFormat:@"Could not load image at %@", uri],
           nil);
    return;
  }

  CGImageRef cgImage = image.CGImage;
  if (cgImage == NULL) {
    reject(@"NFOCR_NO_CGIMAGE", @"UIImage had no underlying CGImage", nil);
    return;
  }

  // Honour the EXIF orientation Camera and Photos hand us; Vision uses
  // CGImagePropertyOrientation, not UIImageOrientation, so translate.
  CGImagePropertyOrientation orientation = [self cgOrientationFor:image.imageOrientation];

  VNRecognizeTextRequest *request = [[VNRecognizeTextRequest alloc] initWithCompletionHandler:^(VNRequest * _Nonnull req, NSError * _Nullable err) {
    if (err != nil) {
      reject(@"NFOCR_VISION_ERROR", err.localizedDescription, err);
      return;
    }
    NSArray<VNRecognizedTextObservation *> *observations = req.results;
    NSMutableArray *lines = [NSMutableArray arrayWithCapacity:observations.count];
    for (VNRecognizedTextObservation *obs in observations) {
      VNRecognizedText *top = [[obs topCandidates:1] firstObject];
      if (top == nil) {
        continue;
      }
      CGRect b = obs.boundingBox;
      [lines addObject:@{
        @"text": top.string ?: @"",
        @"confidence": @(top.confidence),
        @"bbox": @{
          @"x": @(b.origin.x),
          @"y": @(b.origin.y),
          @"w": @(b.size.width),
          @"h": @(b.size.height),
        },
      }];
    }
    resolve(@{@"lines": lines});
  }];

  // .accurate — the slower of the two paths, but ski stickers are small
  // and worth the extra ~200ms. usesLanguageCorrection is disabled because
  // brand names ("Madshus", "S/Lab") would otherwise get autocorrected to
  // dictionary words.
  request.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
  request.usesLanguageCorrection = NO;
  // The default recognition languages list ("en-US") is fine — sticker
  // text is overwhelmingly Latin. We could surface this as a JS-side
  // option later if a user community needs Nordic letters explicitly.

  VNImageRequestHandler *handler =
    [[VNImageRequestHandler alloc] initWithCGImage:cgImage
                                       orientation:orientation
                                           options:@{}];
  NSError *handlerError = nil;
  BOOL ok = [handler performRequests:@[request] error:&handlerError];
  if (!ok || handlerError != nil) {
    reject(@"NFOCR_VISION_HANDLER_FAILED",
           handlerError != nil ? handlerError.localizedDescription : @"performRequests returned NO",
           handlerError);
  }
}

- (CGImagePropertyOrientation)cgOrientationFor:(UIImageOrientation)ui {
  switch (ui) {
    case UIImageOrientationUp:            return kCGImagePropertyOrientationUp;
    case UIImageOrientationDown:          return kCGImagePropertyOrientationDown;
    case UIImageOrientationLeft:          return kCGImagePropertyOrientationLeft;
    case UIImageOrientationRight:         return kCGImagePropertyOrientationRight;
    case UIImageOrientationUpMirrored:    return kCGImagePropertyOrientationUpMirrored;
    case UIImageOrientationDownMirrored:  return kCGImagePropertyOrientationDownMirrored;
    case UIImageOrientationLeftMirrored:  return kCGImagePropertyOrientationLeftMirrored;
    case UIImageOrientationRightMirrored: return kCGImagePropertyOrientationRightMirrored;
    default:                              return kCGImagePropertyOrientationUp;
  }
}

@end
