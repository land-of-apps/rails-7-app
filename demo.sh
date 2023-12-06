git checkout main
rm -rfv .appmap/ tmp/appmap/
bundle install --redownload      
bundle exec rails test || true
appmap archive
base_revision=$(git rev-parse HEAD)
echo $base_revision
rm -rf tmp/appmap 

git checkout $1
bundle install --redownload      
bundle exec rails test || true
appmap archive
head_revision=$(git rev-parse HEAD)
echo $head_revision
appmap restore --exact -r $base_revision --output-dir .appmap/change-report/$base_revision-$head_revision/base
appmap restore --exact -r $head_revision --output-dir .appmap/change-report/$base_revision-$head_revision/head 
appmap compare -b $base_revision -h $head_revision

cat .appmap/change-report/$base_revision-$head_revision/change-report.json | jq -r 'keys[]'

appmap compare-report --source-url file://$(pwd) .appmap/change-report/$base_revision-$head_revision

code .appmap/change-report/$base_revision-$head_revision/report.md