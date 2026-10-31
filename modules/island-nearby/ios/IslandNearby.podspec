Pod::Spec.new do |s|
  s.name = 'IslandNearby'
  s.version = '1.0.0'
  s.summary = 'Private nearby family rooms for Little Island'
  s.description = 'An authored Expo module wrapping encrypted MultipeerConnectivity sessions.'
  s.license = { :type => 'MIT' }
  s.author = 'Shimizu Technology'
  s.homepage = 'https://github.com/Shimizu-Technology/little-island-games'
  s.platforms = { :ios => '16.4' }
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.swift_version = '5.9'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift}'
  s.frameworks = 'MultipeerConnectivity'
end
