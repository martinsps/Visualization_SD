# Visualization_SD
Server for interactive visualization of subgroup discovery algorithms: PRIM and CN2-SD.

There is a docker image with the server ready for use to make it simple and to avoid problems with python version or dependencies. The instructions for its download and use are the following:

1. To pull the image, use the following command in docker (latest version is v2):

<pre><code>sudo docker pull martinsps/flask_server:v2</code></pre>

2. Once pulled, run the image with a name (flask_server for example) in terminal mode indicating a port to communicate with it (in the example, 5000):

<pre><code>sudo docker run --name flask_server -ti -p 5000:5000 martinsps/flask_server:v2</code></pre>

3. Inside the docker running, move to the app directory:

<pre><code>cd home/Visualization_SD</code></pre>

4. Finally, start the app with the following .sh script:

<pre><code>sh run_server.sh</code></pre>

5. Now you can access the flask server from a browser in localhost, port 5000 (0.0.0.0:5000 or 127.0.0.1:5000).
