# UPT - Universal Package Tool


UPT is a **crossplatform** ( thanks to nodejs ) and general purpose package manager that 

aims to be an **universal installer for each kind of software**.

Since actually i'm the only tester of this project, please **be careful with your sensible data**. 

UPT is derived from [Bower](https://github.com/bower/bower) project , inheriting all commands and

keeping the compatibility with bower.json/component.json file ( for now )

we are also on npm https://www.npmjs.org/package/upt

> npm install upt

Would you try upt now? just run this command:

> upt install hw2-core/js-kernel

Note:

1. All packages created with features of original UPT are compatible with our system ( but not vice versa )

2. The commands are the same of original UPT but the binary is called "upt" to avoid collisions

## Actually upt supports:

### CUSTOM PATHS: 
  the installation of packages that use forward slashes in names. So you can use:

> upt install vendor/lib/mylib"  -> this package will be installed in same path specified by the name

______

### GIT FOR DEVS: 
  you can keep .git folder when not in **--production** mode. This allow you to work with your repository.

NOTE: you **MUST** know that after an update/install --force 
the .git folder will be **replaced with new one** from the repository. If you want avoid it atm, you need to add ".git" or ".git/config" entry in
"keep" upt.json array ( read below )

NOTE2: if you're keeping the .git folder, upt will compare the current commit hash during updates ( without --force )
So if the commit hash of new version from repository source is equal to current hash of local git repository, 
the update will be skipped.
______

### AUTO DEP. NAME: 
   you can use the special character "%" for name of dependencies to use original package name as directory
    instead of specifying it. However the dependency name must be defined and be unique for json consistency.  Ex:

```json
 "dependencies" : {
   "%js-library" : "git://github.com/hw2-core/js-library.git"
 }
```

______

### PRESERVE FOLDERS AFTER UPDATES
  you can preserve folders and files after "update" command using the keyword "keep" in your upt.json file
  it is particularly useful when you've sensible data such as uploads , configurations etc. that updating process should
  not destroy. You can use the same syntax of "ignore" key. Ex:

```json
 "keep" : [
   "images",
   "conf/*.conf",
   "data/uploads/",
   "data/db/schema.sql"
 ]
```
If you change one of this keep value in future , remember to use a postinstall script to rename the old directory otherwise it
will be definitively removed.
______

### POWERFUL HOOK SCRIPTS FOR ALL PACKAGES
    you can create an hook script ( a node module ) for all dependencies/installed package , that will be execute at each installer event
    without the need of a .uptrc hook scrips . however uptrc will continue to execute its hooks but they cannot be determined by dependencies of course
    You have to create a folder called **_upt** inside your project where you need to have an **installer_hook.js** script that must have this structure:

```javascript
// action: the step reached by the process
// name: package resolved name ( it's the name of the final directory too)
// config: configurations that contains the current working directory where you're running the process, and other .uptrc / default specifications
// pkgPath: absolute path where the package is installed ( postinstall / preuninstall ) or temp directory ( preinstall / postresolved )
// newMeta: meta descriptions of new installed package in json format
// oldMeta: if we're updating version, it's the old meta description in json format of previous package version.
// callback: you MUST call this function when your instructions end for an ordered execution of hook scripts
module.exports=function(action,config,name,pkgPath,newMeta,oldMeta,callback) {

    switch(action) {
        case "postresolved":
            // YOUR CODE HERE
        break;
        case "preinstall":
            // YOUR CODE HERE
        break;
        case "postinstall":
            // YOUR CODE HERE
        break;
        case "preuninstall":
            // YOUR CODE HERE
        break;
        
        //[...]
    }

    callback();

    return 0;
};
```

______

### CUSTOM PACKAGE PROPERTIES
    You can use upt.custom.json file to add your custom specifications to dependencies. For example you're using a dependency that
    install different folders/files that you don't need? just create your upt.custom.json in directory of dependency with the ignore
    entries. Example:

```json
    {
        "ignore" : [
            "norequiredfolder"
        ]
    }
```
    
Note: 

1. upt.custom.json will replace keys that you define

2. if dependency is not installed yet, you need to create an empty folder where the dep. will be installed with upt.custom.json

3. each time you change something in upt.custom.json , you need to clean the cache with **upt cache clean** command
            and then reinstall/update the dependency with --force flag ( we can avoid it in future )

______

### UPDATE VERSION AND COMMIT/PUSH CHANGES IN BATCH MODE TOO

  Via the 'version' command now you are able to recursively change the version to all packages
  installed and/or commit/push repository changes.

  Use case:
  You have a project with many personal libraries subdivided in multiple repositories
  and you've changed a library function that which involves all other repositories?

    upt version --push --recursive -m "updated code to fit new foo library changes"

______


## FOR DEVS:

Actually i'm hearing for testers and developers. Contact me if you're interested

### Core team

* [@yehonal](https://github.com/yehonal)
