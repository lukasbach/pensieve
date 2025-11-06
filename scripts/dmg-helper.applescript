-- DMG Helper Script
-- This script automatically copies Pensieve.app to Applications and removes quarantine

on run
	set appName to "Pensieve.app"
	set appPath to (path to applications folder as string) & appName
	set dmgVolume to ""
	
	-- Find the DMG volume (where this script is running from)
	try
		tell application "Finder"
			-- Get the disk where this script is located
			set scriptPath to path to me as string
			set dmgVolume to disk of (file scriptPath) as string
		end tell
	on error
		-- Fallback: try to find Pensieve.app in common DMG locations
		set dmgVolume to "/Volumes"
	end try
	
	-- Find Pensieve.app in the DMG
	set sourceAppPath to ""
	try
		tell application "Finder"
			-- Look for Pensieve.app in the DMG volume
			if dmgVolume is not "" then
				set sourceAppPath to (dmgVolume & appName) as string
				if not (file sourceAppPath exists) then
					-- Try looking in /Volumes
					set volumesList to list disks
					repeat with vol in volumesList
						try
							set testPath to (vol as string) & appName
							if (file testPath exists) then
								set sourceAppPath to testPath
								exit repeat
							end if
						end try
					end repeat
				end if
			end if
		end tell
	on error
		set sourceAppPath to ""
	end try
	
	-- If we can't find the app, prompt user
	if sourceAppPath is "" then
		display dialog "Pensieve Installer" & return & return & "Could not find Pensieve.app in the DMG." & return & return & "Please ensure the DMG is open and try again." buttons {"OK"} default button "OK" with icon caution
		return
	end if
	
	-- Check if app already exists in Applications
	set appExists to false
	try
		set appExists to file appPath exists
	on error
		set appExists to false
	end try
	
	if appExists then
		-- Ask if user wants to replace it
		set replaceResult to display dialog "Pensieve Installer" & return & return & "Pensieve.app already exists in Applications." & return & return & "Do you want to replace it?" buttons {"Cancel", "Replace"} default button "Replace" with icon caution
		if button returned of replaceResult is "Cancel" then
			return
		end if
	end if
	
	-- Show progress message
	display dialog "Pensieve Installer" & return & return & "Installing Pensieve to Applications folder..." buttons {} default button "OK" with icon note giving up after 1
	
	-- Copy the app to Applications
	try
		tell application "Finder"
			-- Remove existing app if it exists
			if appExists then
				delete file appPath
			end if
			-- Copy the app
			duplicate file sourceAppPath to folder (path to applications folder)
		end tell
		
		-- Wait a moment for copy to complete
		delay 1
		
		-- Remove quarantine attribute
		try
			do shell script "xattr -d com.apple.quarantine " & quoted form of POSIX path of appPath
		on error
			-- Try alternative method
			do shell script "xattr -cr " & quoted form of POSIX path of appPath
		end try
		
		-- Show success message
		display dialog "Installation Complete!" & return & return & "Pensieve has been successfully installed to Applications." & return & return & "You can now open Pensieve normally." buttons {"Open Pensieve", "OK"} default button "Open Pensieve" with icon note
		if button returned of result is "Open Pensieve" then
			tell application "Finder"
				open file appPath
			end tell
		end if
	on error errorMessage
		display dialog "Installation Failed" & return & return & "An error occurred while installing Pensieve:" & return & return & errorMessage buttons {"OK"} default button "OK" with icon stop
	end try
end run

