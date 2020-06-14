var share_bucket = "yevano-file-share";

AWS.config.region = "us-east-1";

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:ff877c77-322d-4d61-a30a-c4aa5bc7bc74"
});

var s3_handle = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: share_bucket }
});

window.addEventListener("load", event => {
    var file_list_element = document.getElementById("file-list");
    
    s3_handle.listObjects({
        Bucket: share_bucket
    }, (err, data) => {
        //file_list_element.appendChild(document.createTextNode(`${ JSON.stringify(data) }`));
        
        if(err) {
            alert(`Could not list share files. Error: ${ err.message }`);
        } else {
            for(let content of data.Contents) {
                for(let [key, value] of Object.entries(content)) {
                    file_list_element.appendChild(document.createTextNode(`${ key }: ${ value }`));
                    file_list_element.appendChild(document.createElement("br"));
                }
            }
        }
    })
});