Pod::Spec.new do |s|
  s.name         = 'NFOCR'
  s.version      = '0.1.0'
  s.summary      = 'NordicFleet on-device OCR via Apple Vision (VNRecognizeTextRequest).'
  s.description  = 'Local native module wrapping Apple Vision text recognition for the ski-sticker scan flow. No third-party deps — only system frameworks.'
  s.homepage     = 'https://github.com/anthropics/claude-code'
  s.license      = { :type => 'MIT' }
  s.authors      = { 'NordicFleet' => 'noreply@anthropic.com' }
  s.platforms    = { :ios => '13.0' }
  s.source       = { :path => '.' }
  s.source_files = '*.{h,m,mm}'
  s.requires_arc = true
  s.dependency 'React-Core'
  s.frameworks   = 'Vision', 'UIKit', 'CoreGraphics'
end
