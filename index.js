const setupTextarea = document.getElementById('setup-textarea');
const setuploading = document.getElementById('loading-container');
const setupInputContainer = document.getElementById('setup-input-container');
const foodBoxText = document.getElementById('text-box');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const url = "https://api.openai.com/v1/completions";
const url1 = 'https://api.openai.com/v1/images/generations'

document.getElementById("send-btn").addEventListener("click", () => {
  debugger;
  var userInput = $("#setup-textarea").val();
  $("#loading-container").css('display', 'none');
  foodBoxText.innerText = "Ok, just wait a second while my digital brain digests that...";
  fetchBotReply(userInput);
});

async function fetchBotReply(userInput) {
  try {
    const response = await fetchAPI(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_API_KEY
      },
      body: JSON.stringify({
        'model': 'text-davinci-003',
        'prompt': `Generate a short message to enthusiastically say that the user have enough ingredients for making a dish for list of items provided in outline.
    outline: ${userInput}
    message: 
    `,
        'max_tokens': 100, 
        'temperature': 0.8 
      })
    });

    const data = await response.json();
    //console.log(data.choices[0].text);
    setTimeout(function() {
      $("#loading-container").css('display', 'block');
      foodBoxText.innerText = data.choices[0].text;
      fetchRecipe(userInput);
    }, 1000);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function fetchRecipe(outline) {
  try {
    const response = await fetchAPI(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_API_KEY
      },
      body: JSON.stringify({
        'model': 'text-davinci-003',
        'prompt': `Generate a professional stepwise procedure to cook a dish just from the items in the outline.
        outline: ${outline}
        recipe: 
        `
        ,
        'max_tokens': 700
      })
    });

    const data = await response.json();
    const recipe = data.choices[0].text.trim();
    document.getElementById('output-text').innerText = recipe;
    fetchTitle(recipe);
    //fetchStars(recipe);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function fetchTitle(recipe) {
  try {
    const response = await fetchAPI(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_API_KEY
      },
      body: JSON.stringify({
        'model': 'text-davinci-003',
        'prompt': `Generate a professional dish name for this synopsis:\n\n${recipe}`,
        'max_tokens': 20,
        'temperature': 0.6
      })
    });

    const data = await response.json();
    const title = data.choices[0].text.trim();
    document.getElementById('output-title').innerText = title;
    fetchStars(title);
    fetchImagePrompt(title, recipe);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function fetchStars(title) {
  try {
    const response = await fetchAPI(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_API_KEY
      },
      body: JSON.stringify({
        'model': 'text-davinci-003',
        'prompt': `generate the list of country's names and with what name the synopsis is famous in that country containing atmost 2 country's.
          ###
          recipe: ${title}
          names:   
        `,
        'max_tokens': 45,
        'temperature': 0.5
      })
    });

    const data = await response.json();
    const extractedText = data.choices[0].text.trim();
    //const starNames = extractedText.replace('names:', '').trim();
    document.getElementById('output-stars').innerText = extractedText;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function fetchImagePrompt(title, recipe) {
    try {
      const response = await fetchAPI(url, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + OPENAI_API_KEY
        },
        body: JSON.stringify({
          'model': 'text-davinci-003',
          'prompt': `Give a short description of an image with dish name based on a title and synopsis.
          title: ${title}
          recipe: ${recipe}
          image description: 
          `,
          temperature: 0.8,
          max_tokens: 100
        })
      });
  
      const data = await response.json();
      const imagePrompt = data.choices[0].text.trim();
      fetchImageUrl(imagePrompt);
    foodBoxText.innerText = imagePrompt;
    } catch (error) {
      console.error("Error:", error);
    }
  }
  
  async function fetchImageUrl(imagePrompt){
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        prompt:`${imagePrompt}. There should be no text in this image.`,
        n: 1,
        size: '256x256',
        response_format: 'b64_json'
      })
    };
    fetch(url1, requestOptions)
    .then(response => response.json())
    .then(data => {
      //const imageData = data.data[0].b64_json;
      if (data.data && data.data.length > 0) {
        document.getElementById('output-img-container').innerHTML = `<img src="data:image/png;base64,${data.data[0].b64_json}">`;
    }

    document.getElementById('setup-input-container').innerHTML = `<button id="view-pitch-btn" class="view-pitch-btn">View Pitch</button>`;
    
    document.getElementById('view-pitch-btn').addEventListener('click', ()=>{
        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('output-container').style.display = 'flex';
        document.getElementById('output-container').style.flexDirection = 'column';

        document.getElementById('summary').innerText = `Enjoy your meal Bon Appetit`;
    })
    })
  }
  

// Helper function to handle fetch and rate limits
async function fetchAPI(url, options) {
  const response = await fetch(url, options);
  if (response.status === 429) {
    // Handle rate limit by waiting and retrying the request after a delay
    const retryAfter = parseInt(response.headers.get('Retry-After')) || 1;
    await sleep(retryAfter * 1000);
    return fetchAPI(url, options); // Retry the request
  }
  return response;
}

// Helper function to introduce delay using setTimeout
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

