# Hw2-Bower - Universal package manager


Hw2-Bower is a **crossplatform** ( thank to nodejs ) and general purpose package manager that 

aims to be an **universal installer for each kind of software**.

Hw2-Bower is a fork of [Bower](https://github.com/bower/bower) project.

Since actually i'm the only tester of this project, please **be careful with your sensible data**. 

Official README and LICENSE on (https://github.com/bower/bower)  

See [bower-pullrequest](https://github.com/hw2-core/bower/tree/bower-pullrequest) branch for changes that concern only bower

hw2-bower is also on npm https://www.npmjs.org/package/hw2core-bower

> npm install hw2core-bower

The commands are same of original bower but the binary is called "hw2-bower" to avoid collision

### Actually hw2-bower supports:

* the installation of packages that use forward slashes in names. So you can use:

"hw2-bower install vendor/lib/mylib"  -> this package will be installed in same path specified by the name

* you can keep .git folder when not in --production mode. This allow you to work with your repository.

* Comments in bower.json using this syntax:

```json
 {
   "//" : "it's a comment"
 }
```

* you can use the special character "%" for dependencies name to use original package name as directory
    instead of specifying it. However the dependency name must be defined and be unique for json consistency.  Ex:

```json
 dependencies: {
   "//" : "it will be installed in Hw2/Js/library ( retrieved from package bower.json )"
   "%js-library" : "git://github.com/hw2-core/js-library.git"
 }
```

## FOR DEVS:

Actually i'm hearing for testers and developers.

Hw2-Bower has a less restrictive policy than its fork , 

so you are free of implement new features for universal purpose nature of the project ( that can be easily pulled to original fork if needed )

features implemented in hw2core-bower needed also for hw2core itself , and some of them could not be merged with official repository just for rejected requests by the official team ( https://github.com/bower/bower/pull/1390 )

since they consider only the web part.

### Core team

* [@yehonal](https://github.com/yehonal)
