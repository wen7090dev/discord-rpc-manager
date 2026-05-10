; Custom NSIS script — hooks into electron-builder's generated installer
; Language detection is automatic: NSIS picks the active MUI language.
; Fallback = first MUI_LANGUAGE declared (English).

; ─── Auto-update: silent install when launched by electron-updater ────────────
; electron-updater always passes --updated when running the installer for an
; update. We detect it here and force silent mode so the wizard is skipped.
; First-time installs (no --updated flag) still show the full UI.
!macro customInit
  !include "FileFunc.nsh"
  ClearErrors
  ${GetOptions} $CMDLINE "--updated" $R0
  ${IfNot} ${Errors}
    SetSilent silent
  ${EndIf}
!macroend

!macro customHeader
  ; ── Uninstall data prompt — needed in both installer & uninstaller builds ──
  LangString MAINT_DATA_PROMPT ${LANG_ENGLISH} \
    "Do you want to delete ALL application data?$\n\
(RPC profiles, settings, logs)$\n$\n\
If you are permanently uninstalling, answer Yes."
  LangString MAINT_DATA_PROMPT ${LANG_FRENCH} \
    "Voulez-vous supprimer TOUTES les données de l'application ?$\n\
(Profils RPC, paramètres, logs)$\n$\n\
Si vous désinstallez définitivement, répondez Oui."
  LangString MAINT_DATA_PROMPT ${LANG_SPANISHINTERNATIONAL} \
    "¿Desea eliminar TODOS los datos de la aplicación?$\n\
(Perfiles RPC, configuración, registros)$\n$\n\
Si desinstala definitivamente, responda Sí."
  LangString MAINT_DATA_PROMPT ${LANG_GERMAN} \
    "Möchten Sie ALLE Anwendungsdaten löschen?$\n\
(RPC-Profile, Einstellungen, Protokolle)$\n$\n\
Wenn Sie endgültig deinstallieren, antworten Sie mit Ja."

  !ifndef BUILD_UNINSTALLER
    !include "nsDialogs.nsh"

    ; ── Maintenance page strings (installer only) ────────────────────────────
    LangString MAINT_TITLE    ${LANG_ENGLISH} "Already installed"
    LangString MAINT_TITLE    ${LANG_FRENCH}  "Déjà installé"
    LangString MAINT_TITLE    ${LANG_SPANISHINTERNATIONAL} "Ya instalado"
    LangString MAINT_TITLE    ${LANG_GERMAN}  "Bereits installiert"

    LangString MAINT_SUBTITLE ${LANG_ENGLISH} \
      "Select what you want to do with Discord RPC Manager."
    LangString MAINT_SUBTITLE ${LANG_FRENCH} \
      "Choisissez ce que vous souhaitez faire avec Discord RPC Manager."
    LangString MAINT_SUBTITLE ${LANG_SPANISHINTERNATIONAL} \
      "Seleccione qué desea hacer con Discord RPC Manager."
    LangString MAINT_SUBTITLE ${LANG_GERMAN} \
      "Wählen Sie aus, was Sie mit Discord RPC Manager tun möchten."

    LangString MAINT_CUR_LOC  ${LANG_ENGLISH} "Installed location:"
    LangString MAINT_CUR_LOC  ${LANG_FRENCH}  "Emplacement actuel :"
    LangString MAINT_CUR_LOC  ${LANG_SPANISHINTERNATIONAL} "Ubicación actual:"
    LangString MAINT_CUR_LOC  ${LANG_GERMAN}  "Aktueller Speicherort:"

    LangString MAINT_ACTION   ${LANG_ENGLISH} "Select an action:"
    LangString MAINT_ACTION   ${LANG_FRENCH}  "Sélectionnez une action :"
    LangString MAINT_ACTION   ${LANG_SPANISHINTERNATIONAL} "Seleccione una acción:"
    LangString MAINT_ACTION   ${LANG_GERMAN}  "Wählen Sie eine Aktion:"

    LangString MAINT_REPAIR   ${LANG_ENGLISH} \
      "Repair / Update  —  reinstall files, keep your profiles && settings"
    LangString MAINT_REPAIR   ${LANG_FRENCH} \
      "Réparer / Mettre à jour  —  réinstaller les fichiers, conserver vos profils && paramètres"
    LangString MAINT_REPAIR   ${LANG_SPANISHINTERNATIONAL} \
      "Reparar / Actualizar  —  reinstalar archivos, conservar perfiles && configuración"
    LangString MAINT_REPAIR   ${LANG_GERMAN} \
      "Reparieren / Aktualisieren  —  Dateien neu installieren, Profile && Einstellungen behalten"

    LangString MAINT_UNINST   ${LANG_ENGLISH} \
      "Uninstall  —  remove the application from this computer"
    LangString MAINT_UNINST   ${LANG_FRENCH} \
      "Désinstaller  —  supprimer l'application de cet ordinateur"
    LangString MAINT_UNINST   ${LANG_SPANISHINTERNATIONAL} \
      "Desinstalar  —  eliminar la aplicación de este equipo"
    LangString MAINT_UNINST   ${LANG_GERMAN} \
      "Deinstallieren  —  Anwendung von diesem Computer entfernen"

    Var maint_rb_repair
    Var maint_rb_uninstall

    Function maint_PageCreate
      ; $hasPerUserInstallation / $perUserInstallationFolder set by initMultiUser
      StrCpy $0 ""
      ${If} $hasPerUserInstallation == "1"
        StrCpy $0 $perUserInstallationFolder
      ${ElseIf} $hasPerMachineInstallation == "1"
        StrCpy $0 $perMachineInstallationFolder
      ${EndIf}

      ; Fresh install → skip this page
      ${If} $0 == ""
        Abort
      ${EndIf}

      !insertmacro MUI_HEADER_TEXT "$(MAINT_TITLE)" "$(MAINT_SUBTITLE)"

      nsDialogs::Create 1018
      Pop $1
      ${If} $1 == error
        Abort
      ${EndIf}

      ${NSD_CreateLabel} 0 0 100% 16u "$(MAINT_CUR_LOC)"
      Pop $1

      ${NSD_CreateLabel} 0 16u 100% 14u "$0"
      Pop $1
      SetCtlColors $1 "777777" "transparent"

      ${NSD_CreateLabel} 0 40u 100% 14u "$(MAINT_ACTION)"
      Pop $1

      ${NSD_CreateRadioButton} 16u 60u 100% 16u "$(MAINT_REPAIR)"
      Pop $maint_rb_repair
      ${NSD_Check} $maint_rb_repair

      ${NSD_CreateRadioButton} 16u 84u 100% 16u "$(MAINT_UNINST)"
      Pop $maint_rb_uninstall

      nsDialogs::Show
    FunctionEnd

    Function maint_PageLeave
      ${NSD_GetState} $maint_rb_uninstall $0
      ${If} $0 == ${BST_CHECKED}
        StrCpy $1 $perUserInstallationFolder
        ${If} $1 == ""
          StrCpy $1 $perMachineInstallationFolder
        ${EndIf}
        ReadRegStr $2 HKCU "${INSTALL_REGISTRY_KEY}" UninstallString
        ${If} $2 == ""
          ReadRegStr $2 HKLM "${INSTALL_REGISTRY_KEY}" UninstallString
        ${EndIf}
        ${If} $2 != ""
          ExecWait '"$2" _?=$1'
        ${Else}
          ExecWait '"$1\Uninstall Discord RPC Manager.exe" _?=$1'
        ${EndIf}
        Quit
      ${EndIf}
      ; Repair / Update → continue with the normal install wizard
    FunctionEnd
  !endif ; BUILD_UNINSTALLER
!macroend

; First page in the wizard — skipped automatically on fresh install.
!macro customWelcomePage
  Page custom maint_PageCreate maint_PageLeave
!macroend

; ─── Uninstall hook ───────────────────────────────────────────────────────────
; The installer calls the uninstaller with /S during upgrades — skip prompt then.
!macro customUnInstall
  ${IfNot} ${Silent}
    MessageBox MB_YESNO|MB_ICONQUESTION "$(MAINT_DATA_PROMPT)" \
      IDNO skip_data_delete

      RMDir /r "$APPDATA\Discord RPC Manager"
      RMDir /r "$INSTDIR\_portable"

    skip_data_delete:
  ${EndIf}
!macroend
