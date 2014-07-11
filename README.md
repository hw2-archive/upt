# Hw2-Bower

Official README and LICENSE on (https://github.com/bower/bower)  

See [bower-pullrequest](https://github.com/hw2-core/bower/tree/bower-pullrequest) branch for changes that concern only bower

# Universal package manager

The commands are same of original bower but the binary is called "hw2-bower" to avoid collision

Actually hw2-bower supports:

1) the installation of packages that use forward slashes in names. So you can use:

"hw2-bower install vendor/lib/mylib"  -> this package will be installed in same path specified by the name

2) you can keep .git folder when not in --production mode. This allow you to work with your repository.


features implemented in hw2core-bower needed for hw2core itself , and some of them could not be merged with official repository just for rejected requests by the official team ( https://github.com/bower/bower/pull/1390 )

### Core team

* [@yehonal](https://github.com/yehonal)
