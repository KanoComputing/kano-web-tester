<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Web tester</title>
        <link rel="shortcut icon" href="${ROOT}/assets/favicon.ico" type="image/x-icon">
        <link rel="icon" href="${ROOT}/assets/favicon.ico" type="image/x-icon">
        <link rel="stylesheet" href="${MOCHA_CSS}"></link>
        <style>
            .header {
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                margin: 10px 0px 0px 10px;
            }
            .header img {
                width: 36px;
                height: 36px;
            }
            .header span {
                font-size: 20px;
                margin-left: 8px;
            }
            #mocha {
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img id="main-icon" src="${ROOT}/assets/icon.svg" />
            <span>Web tester</span>
        </div>
        <div id="mocha"></div>
        <script type="module">
            import { loadTests } from '${IMPORT}';
            loadTests(${TESTS}, ${MOCHA_OPTS});
        </script>
    </body>
</html>