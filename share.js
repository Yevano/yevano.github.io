var share_bucket = "yevano-file-share";
var share_path = "share";

var s3_url = "https://s3.amazonaws.com";
var share_url = `${ s3_url }/${ share_bucket }`;

AWS.config.region = "us-east-1";

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:ff877c77-322d-4d61-a30a-c4aa5bc7bc74"
});

var s3_handle = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: share_bucket }
});

window.addEventListener("load", _ => {
    var file_list_element = document.getElementById("file-list");
    
    s3_handle.listObjects({
        Bucket: share_bucket
    }, (err, data) => {        
        if(err) {
            alert(`Could not list share files. Error: ${ err.message }`);
        } else {
            var contents = data.Contents.sort((a, b) => {
                var date_a = a.LastModified;
                var date_b = b.LastModified;
                return date_a < date_b;
            });

            contents.forEach(content => {
                var file_url = `${ share_url }/${ content.Key }`
                var file_name = `${ content.Key.substr(file_url.indexOf("/")) }`;

                var img_div

                var file_img_element = document.createElement("img");
                file_img_element.src = file_url;
                file_img_element.style = "width: 400px";
                file_img_element.onerror = event => {
                    file_img_element.onerror = null;
                    img_div.removeChild(file_img_element);
                }

                img_div = document.createElement("div");
                img_div.className = "file-item";
                img_div.appendChild(file_img_element);
                
                var info_anchor = document.createElement("a");
                info_anchor.href = file_url;
                info_anchor.appendChild(document.createTextNode(file_name));

                var info_div = document.createElement("div");
                info_div.className = "file-item";
                info_div.appendChild(info_anchor);
                info_div.appendChild(document.createElement("br"));
                info_div.appendChild(document.createTextNode(content.LastModified));

                file_list_element.appendChild(img_div);
                file_list_element.appendChild(info_div);
            });
        }
    })
});