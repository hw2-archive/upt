# Hw2-Bower - Universal package manager


Hw2-Bower is a **crossplatform** ( thanks to nodejs ) and general purpose package manager that 

aims to be an **universal installer for each kind of software**.

Since actually i'm the only tester of this project, please **be careful with your sensible data**. 

Hw2-Bower is a fork of [Bower](https://github.com/bower/bower) project. Official README and LICENSE on (https://github.com/bower/bower)  

See [bower-pullrequest](https://github.com/hw2-core/bower/tree/bower-pullrequest) branch for changes that concern only original project

we are also on npm https://www.npmjs.org/package/hw2core-bower

> npm install hw2core-bower

The commands are same of original Bower but the binary is called "hw2-bower" to avoid collision

### Actually hw2-bower supports:

* the installation of packages that use forward slashes in names. So you can use:

> hw2-bower install vendor/lib/mylib"  -> this package will be installed in same path specified by the name

______

* you can keep .git folder when not in **--production mode.** This allow you to work with your repository.

______

* Comments in bower.json using this syntax:

```json
 {
   "//" : "it's a comment"
 }
```

______

* you can use the special character "%" for dependencies name to use original package name as directory
    instead of specifying it. However the dependency name must be defined and be unique for json consistency.  Ex:

```json
 "dependencies" : {
   "//" : "it will be installed in Hw2/Js/library ( retrieved from package bower.json )"
   "%js-library" : "git://github.com/hw2-core/js-library.git"
 }
```

______

* you can preserve folders and files after "update" command using the keyword "keep" in your bower.json file
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

* you can create an hook script ( a node module ) for all dependencies/installed package , that will be execute at each installer event
    without the need of a .bowerrc hook scrips . however bowerrc will continue to execute its hooks but they cannot be determined by dependencies of course
    You have to create a folder called **_hw2** inside your project where you need to have an **installer_hook.js** script that must have this structure:

```javascript
// action: the step reached by the process ( only postinstall and preuninstall are implemented for now 
// cwdPath: the current working directory where you're running the process
// pkgPath: absolute path where the package is installed
module.exports=function(action,cwdPath,pkgPath) {

    switch(action) {
        case "postinstall":
            // YOUR CODE HERE
        break;
        case "preuninstall":
            // YOUR CODE HERE
        break;
    }

    return 0;
};
```

______

* You can use bower.custom.json file to add your custom specifications to dependencies. For example you're using a dependency that
    install different folders/files that you don't need? just create your bower.custom.json in directory of dependency with the ignore
    entries. Example:

```json
    {
        "ignore" : [
            "norequiredfolder"
        ]
    }
```
    
Note: 

1. bower.custom.json will replace keys that you define

2. if dependency is not installed yet, you need to create an empty folder where the dep. will be installed with bower.custom.json

3. each time you change something in bower.custom.json , you need to clean the cache with **hw2-bower cache clean** command
            and then reinstall/update the dependency with --force flag ( we can avoid it in future )

______


## FOR DEVS:

Actually i'm hearing for testers and developers.

Hw2-Bower has a less restrictive policy than its fork , 

so you are free to implement new features for universal purpose nature of the project ( that can be easily pulled to original fork if needed )

Some features implemented in hw2core-bower could not be merged with official repository just for rejected requests by the official team ( https://github.com/bower/bower/pull/1390 )
since they are considering only the web part.

other bower modules forked and modified for hw2-bower:
bower-endpoint-parser -> https://github.com/hw2-core/endpoint-parser

Comparing forks: 

hw2-bower < - > bower : 
https://github.com/hw2-core/bower/compare/bower:master...hw2-core:bower-pullrequest

hw2-endpoint-parser < - > bower-endpoint-parser : 
https://github.com/hw2-core/endpoint-parser/compare/bower:master...hw2-core:bower-pullrequest

### Core team

* [@yehonal](https://github.com/yehonal)
